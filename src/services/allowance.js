import { ApiError } from '../utils/apiError.js';

const TOTAL_CAP = 500000;

export function computeAllowance(user, accounts) {
  if (user.amountAllowable != null && user.amountAllowable !== 0) {
    return { mode: 'set', amountAllowable: user.amountAllowable };
  }

  if (!accounts.length) {
    throw new ApiError(400, 'User has no accounts', 'NO_ACCOUNTS');
  }

  const balance = accounts[0].balance;
  const allowableValue = TOTAL_CAP - balance;
  return { mode: 'first', allowableValue };
}

export function validateAndComputeNewAllowance(user, accounts, amount) {
  const allowance = computeAllowance(user, accounts);

  if (allowance.mode === 'first') {
    const { allowableValue } = allowance;
    if (amount >= allowableValue) {
      const err = new ApiError(
        400,
        `Your allowed amount is ${allowableValue}`,
        'ALLOWANCE_EXCEEDED'
      );
      err.amountAllowable = allowableValue;
      throw err;
    }
    const newAmountAllowable = TOTAL_CAP - (allowableValue + amount);
    return { newAmountAllowable };
  }

  const { amountAllowable } = allowance;
  if (amount >= amountAllowable) {
    const err = new ApiError(
      400,
      `Your allowed amount is ${amountAllowable}`,
      'ALLOWANCE_EXCEEDED'
    );
    err.amountAllowable = amountAllowable;
    throw err;
  }

  return { newAmountAllowable: amountAllowable - amount };
}
