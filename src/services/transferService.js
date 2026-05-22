import mongoose from 'mongoose';
import { getSession } from '../config/db.js';
import { Account } from '../models/Account.js';
import { Transaction } from '../models/Transaction.js';
import { User } from '../models/User.js';
import { serializeTransaction } from '../utils/serializeUser.js';
import { sanitizeString } from '../utils/sanitize.js';
import { badRequest, notFound } from '../utils/apiError.js';

export async function transferFunds(
  senderUserId,
  { senderAccountId, recipientAccountNumber, recipientUserId, amount, memo }
) {
  const sanitizedMemo = sanitizeString(memo ?? '');

  const session = await getSession();
  let result;

  try {
    await session.withTransaction(async () => {
      const senderAccount = await Account.findOne({
        _id: senderAccountId,
        userId: senderUserId,
      }).session(session);

      if (!senderAccount) {
        throw notFound('Sender account not found', 'ACCOUNT_NOT_FOUND');
      }

      if (senderAccount.balance <= amount) {
        throw badRequest('Insufficient balance', 'INSUFFICIENT_BALANCE');
      }

      const recipientUser = await User.findById(recipientUserId).session(session);
      if (!recipientUser) {
        throw notFound('Recipient not found', 'USER_NOT_FOUND');
      }

      const recipientAccount = await Account.findOne({
        accountNumber: recipientAccountNumber,
        userId: recipientUserId,
      }).session(session);

      if (!recipientAccount) {
        throw notFound('Recipient account not found', 'ACCOUNT_NOT_FOUND');
      }

      if (senderAccount._id.equals(recipientAccount._id)) {
        throw badRequest('Cannot transfer to the same account', 'SAME_ACCOUNT');
      }

      senderAccount.balance -= amount;
      recipientAccount.balance += amount;
      await senderAccount.save({ session });
      await recipientAccount.save({ session });

      const date = new Date().toISOString();

      const [debitTx] = await Transaction.create(
        [
          {
            userId: senderUserId,
            type: 'debit',
            amount,
            memo: sanitizedMemo,
            date,
          },
        ],
        { session }
      );

      await Transaction.create(
        [
          {
            userId: recipientUserId,
            type: 'credit',
            amount,
            memo: sanitizedMemo,
            date,
          },
        ],
        { session }
      );

      result = {
        message: 'Funds transferred successfully',
        debitTransaction: serializeTransaction(debitTx),
        senderAccount: {
          id: senderAccount._id.toString(),
          balance: senderAccount.balance,
        },
        recipientAccount: {
          accountNumber: recipientAccount.accountNumber,
          balance: recipientAccount.balance,
        },
      };
    });

    return result;
  } finally {
    session.endSession();
  }
}

export async function getTransactions(userId, accountId) {
  const query = { userId: new mongoose.Types.ObjectId(userId) };
  const transactions = await Transaction.find(query).sort({ createdAt: -1 }).lean();

  if (accountId) {
    return transactions.map((tx) => ({
      id: tx._id.toString(),
      type: tx.type,
      amount: tx.amount,
      memo: tx.memo,
      date: tx.date,
    }));
  }

  return transactions.map((tx) => ({
    id: tx._id.toString(),
    type: tx.type,
    amount: tx.amount,
    memo: tx.memo,
    date: tx.date,
  }));
}
