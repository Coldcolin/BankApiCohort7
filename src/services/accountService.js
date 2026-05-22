import { getSession } from '../config/db.js';
import { Account } from '../models/Account.js';
import { User } from '../models/User.js';
import { createUniqueAccountNumber } from './accountNumber.js';
import { validateAndComputeNewAllowance } from './allowance.js';
import { serializeAccount } from '../utils/serializeUser.js';
import { sanitizeFields } from '../utils/sanitize.js';
import { badRequest, notFound } from '../utils/apiError.js';

export async function addAccount(user, { accountName, amount }) {
  const sanitized = sanitizeFields({ accountName }, ['accountName']);
  if (!sanitized.accountName) throw badRequest('Account name is required', 'VALIDATION_ERROR');

  const session = await getSession();
  let newAccount;

  try {
    await session.withTransaction(async () => {
      const freshUser = await User.findById(user._id).session(session);
      const accounts = await Account.find({ userId: user._id }).sort({ createdAt: 1 }).session(session);

      const { newAmountAllowable } = validateAndComputeNewAllowance(freshUser, accounts, amount);

      const accountNumber = await createUniqueAccountNumber(session);
      const [account] = await Account.create(
        [
          {
            userId: user._id,
            accountNumber,
            accountName: sanitized.accountName,
            balance: amount,
          },
        ],
        { session }
      );
      newAccount = account;

      freshUser.amountAllowable = newAmountAllowable;
      await freshUser.save({ session });
    });

    return { account: serializeAccount(newAccount) };
  } finally {
    session.endSession();
  }
}

export async function listAccounts(userId) {
  const accounts = await Account.find({ userId }).sort({ createdAt: 1 }).lean();
  return accounts.map((a) => ({
    id: a._id.toString(),
    accountNumber: a.accountNumber,
    accountName: a.accountName,
    balance: a.balance,
  }));
}

export async function lookupAccount(accountNumber) {
  const account = await Account.findOne({ accountNumber }).lean();
  if (!account) throw notFound('Account not found', 'ACCOUNT_NOT_FOUND');

  const user = await User.findById(account.userId).lean();
  if (!user) throw notFound('Account not found', 'ACCOUNT_NOT_FOUND');

  return {
    userId: user._id.toString(),
    fullName: user.fullName,
    accountName: account.accountName,
    accountNumber: account.accountNumber,
  };
}

export async function getAccountByNumber(accountNumber, requesterUserId) {
  const account = await Account.findOne({ accountNumber }).lean();
  if (!account) throw notFound('Account not found', 'ACCOUNT_NOT_FOUND');

  const owner = await User.findById(account.userId).lean();
  if (!owner) throw notFound('Account not found', 'ACCOUNT_NOT_FOUND');

  return {
    ...serializeAccount(account),
    fullName: owner.fullName,
    isOwner: account.userId.toString() === requesterUserId,
  };
}
