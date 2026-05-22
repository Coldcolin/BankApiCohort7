import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { connectDb, disconnectDb } from '../config/db.js';
import { User } from '../models/User.js';
import { Account } from '../models/Account.js';
import { createUniqueAccountNumber } from '../services/accountNumber.js';

dotenv.config();

async function seed() {
  await connectDb();

  const email = 'demo@bank.com';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Demo user already exists:', email);
    await disconnectDb();
    return;
  }

  const passwordHash = await bcrypt.hash('DemoPass1!', Number(process.env.BCRYPT_ROUNDS) || 12);
  const user = await User.create({
    fullName: 'Demo User',
    email,
    passwordHash,
  });

  const accountNumber = await createUniqueAccountNumber();
  await Account.create({
    userId: user._id,
    accountNumber,
    accountName: 'Main Account',
    balance: 200000,
  });

  console.log('Demo user created:');
  console.log('  email:', email);
  console.log('  password: DemoPass1!');
  console.log('  accountNumber:', accountNumber);

  await disconnectDb();
}

seed().catch(async (err) => {
  console.error(err);
  await disconnectDb();
  process.exit(1);
});
