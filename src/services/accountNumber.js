import { Account } from '../models/Account.js';

const MAX_RETRIES = 10;

export function generateAccountNumber() {
  return `ACC${Math.floor(100000 + Math.random() * 900000)}`;
}

export async function createUniqueAccountNumber(session) {
  for (let i = 0; i < MAX_RETRIES; i++) {
    const accountNumber = generateAccountNumber();
    const exists = await Account.findOne({ accountNumber }).session(session ?? null).lean();
    if (!exists) return accountNumber;
  }
  throw new Error('Failed to generate unique account number');
}
