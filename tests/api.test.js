import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let app;
let replSet;

async function connectTestDb() {
  if (process.env.MONGODB_TEST_URI) {
    process.env.DATABASE_URL = process.env.MONGODB_TEST_URI;
    await mongoose.connect(process.env.DATABASE_URL);
    return;
  }

  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    binary: { version: '6.0.15' },
  });
  process.env.DATABASE_URL = replSet.getUri();
  await mongoose.connect(process.env.DATABASE_URL);
}

beforeAll(async () => {
  await connectTestDb();
  const { createApp } = await import('../src/app.js');
  app = createApp();
}, 600000);

afterAll(async () => {
  await mongoose.disconnect();
  if (replSet) await replSet.stop();
});

const testUser = {
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  password: 'SecurePass1!',
  confirmPassword: 'SecurePass1!',
};

const testUser2 = {
  fullName: 'John Smith',
  email: 'john@example.com',
  password: 'SecurePass2!',
  confirmPassword: 'SecurePass2!',
};

async function signupUser(user = testUser) {
  const res = await request(app).post('/api/v1/auth/signup').send(user);
  expect(res.status).toBe(201);
  return res.body;
}

describe('Banking API', () => {
  it('signs up a user with main account', async () => {
    const body = await signupUser();
    expect(body.message).toBe('Account created successfully');
    expect(body.accessToken).toBeDefined();
    expect(body.user.email).toBe(testUser.email);
    expect(body.user.accounts).toHaveLength(1);
    expect(body.user.accounts[0].accountName).toBe('Main Account');
    expect(body.user.accounts[0].balance).toBe(200000);
    expect(body.user.transactions).toEqual([]);
  });

  it('rejects duplicate email on signup', async () => {
    await signupUser();
    const res = await request(app).post('/api/v1/auth/signup').send(testUser);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_EXISTS');
  });

  it('logs in and returns user', async () => {
    await signupUser();
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Login successful');
    expect(res.body.user.accounts).toHaveLength(1);
  });

  it('rejects invalid login credentials', async () => {
    await signupUser();
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: 'WrongPass1!' });
    expect(res.status).toBe(401);
  });

  it('returns current user from /auth/me', async () => {
    const signup = await signupUser();
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${signup.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.totalBalance).toBe(200000);
  });

  it('adds a new account with allowance rules', async () => {
    const signup = await signupUser();
    const token = signup.accessToken;

    const res = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ accountName: 'Savings', amount: 100000 });

    expect(res.status).toBe(201);
    expect(res.body.account.accountName).toBe('Savings');
    expect(res.body.account.balance).toBe(100000);
  });

  it('rejects add account when allowance exceeded', async () => {
    const signup = await signupUser();
    const token = signup.accessToken;

    const res = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ accountName: 'Savings', amount: 400000 });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('ALLOWANCE_EXCEEDED');
    expect(res.body.amountAllowable).toBe(300000);
  });

  it('transfers funds between users', async () => {
    const sender = await signupUser();
    const recipient = await signupUser(testUser2);

    const senderAccountId = sender.user.accounts[0].id;
    const recipientAccountNumber = recipient.user.accounts[0].accountNumber;
    const recipientUserId = recipient.user.id;

    const res = await request(app)
      .post('/api/v1/transfers')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({
        senderAccountId,
        recipientAccountNumber,
        recipientUserId,
        amount: 5000,
        memo: 'Rent',
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Funds transferred successfully');
    expect(res.body.senderAccount.balance).toBe(195000);
    expect(res.body.debitTransaction.type).toBe('debit');
  });

  it('rejects transfer with insufficient balance', async () => {
    const sender = await signupUser();
    const recipient = await signupUser(testUser2);

    const res = await request(app)
      .post('/api/v1/transfers')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({
        senderAccountId: sender.user.accounts[0].id,
        recipientAccountNumber: recipient.user.accounts[0].accountNumber,
        recipientUserId: recipient.user.id,
        amount: 200000,
        memo: 'Too much',
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INSUFFICIENT_BALANCE');
  });

  it('looks up account by number', async () => {
    const user = await signupUser();
    const accountNumber = user.user.accounts[0].accountNumber;

    const res = await request(app)
      .get(`/api/v1/accounts/lookup/${accountNumber}`)
      .set('Authorization', `Bearer ${user.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.fullName).toBe(testUser.fullName);
    expect(res.body.accountNumber).toBe(accountNumber);
    expect(res.body.balance).toBeUndefined();
  });

  it('lists transactions for user', async () => {
    const sender = await signupUser();
    const recipient = await signupUser(testUser2);

    await request(app)
      .post('/api/v1/transfers')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({
        senderAccountId: sender.user.accounts[0].id,
        recipientAccountNumber: recipient.user.accounts[0].accountNumber,
        recipientUserId: recipient.user.id,
        amount: 1000,
        memo: 'Test',
      });

    const res = await request(app)
      .get('/api/v1/transactions')
      .set('Authorization', `Bearer ${sender.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].type).toBe('debit');
  });

  it('deletes user account', async () => {
    const user = await signupUser();
    const res = await request(app)
      .delete(`/api/v1/users/${user.user.id}`)
      .set('Authorization', `Bearer ${user.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Account deleted successfully');

    const me = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${user.accessToken}`);
    expect(me.status).toBe(401);
  });

  it('forbids deleting another user', async () => {
    const user1 = await signupUser();
    const user2 = await signupUser(testUser2);

    const res = await request(app)
      .delete(`/api/v1/users/${user2.user.id}`)
      .set('Authorization', `Bearer ${user1.accessToken}`);

    expect(res.status).toBe(403);
  });
});
