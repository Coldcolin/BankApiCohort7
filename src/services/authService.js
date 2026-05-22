import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { getSession } from '../config/db.js';
import { User } from '../models/User.js';
import { Account } from '../models/Account.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { createUniqueAccountNumber } from './accountNumber.js';
import { serializeUser } from '../utils/serializeUser.js';
import { sanitizeFields } from '../utils/sanitize.js';
import { conflict, unauthorized } from '../utils/apiError.js';

function signAccessToken(userId) {
  return jwt.sign({ sub: userId.toString() }, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES,
  });
}

function signRefreshToken(userId) {
  return jwt.sign({ sub: userId.toString(), type: 'refresh' }, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES,
  });
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function signup({ fullName, email, password }) {
  const sanitized = sanitizeFields({ fullName, email }, ['fullName']);
  const existing = await User.findOne({ email: sanitized.email.toLowerCase() });
  if (existing) throw conflict('Email already exists', 'EMAIL_EXISTS');

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
  const session = await getSession();

  try {
    let user;
    await session.withTransaction(async () => {
      const [createdUser] = await User.create(
        [{ fullName: sanitized.fullName, email: sanitized.email.toLowerCase(), passwordHash }],
        { session }
      );
      user = createdUser;

      const accountNumber = await createUniqueAccountNumber(session);
      await Account.create(
        [
          {
            userId: user._id,
            accountNumber,
            accountName: 'Main Account',
            balance: 200000,
          },
        ],
        { session }
      );
    });

    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      userId: user._id,
      tokenHash: hashToken(refreshToken),
      expiresAt,
    });

    const userResponse = await serializeUser(user);
    return {
      message: 'Account created successfully',
      accessToken,
      refreshToken,
      user: userResponse,
    };
  } finally {
    session.endSession();
  }
}

export async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) throw unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');

  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt,
  });

  const userResponse = await serializeUser(user);
  return {
    message: 'Login successful',
    accessToken,
    refreshToken,
    user: userResponse,
  };
}

export async function logout(userId, refreshToken) {
  if (refreshToken) {
    await RefreshToken.deleteOne({
      userId,
      tokenHash: hashToken(refreshToken),
    });
  } else {
    await RefreshToken.deleteMany({ userId });
  }
  return { message: 'Logged out successfully' };
}

export async function getMe(user) {
  const userResponse = await serializeUser(user, { includeTotalBalance: true });
  return { user: userResponse };
}
