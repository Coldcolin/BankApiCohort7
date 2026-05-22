import { User } from '../models/User.js';
import { Account } from '../models/Account.js';
import { Transaction } from '../models/Transaction.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { forbidden, notFound } from '../utils/apiError.js';

export async function deleteUser(requesterId, targetUserId) {
  if (requesterId !== targetUserId) {
    throw forbidden('You can only delete your own account', 'FORBIDDEN');
  }

  const user = await User.findById(targetUserId);
  if (!user) throw notFound('User not found', 'USER_NOT_FOUND');

  await Promise.all([
    Account.deleteMany({ userId: targetUserId }),
    Transaction.deleteMany({ userId: targetUserId }),
    RefreshToken.deleteMany({ userId: targetUserId }),
    User.deleteOne({ _id: targetUserId }),
  ]);

  return { message: 'Account deleted successfully' };
}
