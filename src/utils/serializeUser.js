import { Account } from '../models/Account.js';
import { Transaction } from '../models/Transaction.js';

export async function serializeUser(user, { includeTotalBalance = false } = {}) {
  const userId = user._id;
  const [accounts, transactions] = await Promise.all([
    Account.find({ userId }).sort({ createdAt: 1 }).lean(),
    Transaction.find({ userId }).sort({ createdAt: 1 }).lean(),
  ]);

  const serialized = {
    id: userId.toString(),
    fullName: user.fullName,
    email: user.email,
    accounts: accounts.map((account) => ({
      id: account._id.toString(),
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      balance: account.balance,
    })),
    transactions: transactions.map((tx) => ({
      id: tx._id.toString(),
      type: tx.type,
      amount: tx.amount,
      memo: tx.memo,
      date: tx.date,
    })),
  };

  if (user.amountAllowable != null) {
    serialized.amountAllowable = user.amountAllowable;
  }

  if (includeTotalBalance) {
    serialized.totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  }

  return serialized;
}

export function serializeAccount(account) {
  return {
    id: account._id.toString(),
    accountNumber: account.accountNumber,
    accountName: account.accountName,
    balance: account.balance,
  };
}

export function serializeTransaction(tx) {
  return {
    id: tx._id.toString(),
    type: tx.type,
    amount: tx.amount,
    memo: tx.memo,
    date: tx.date,
  };
}
