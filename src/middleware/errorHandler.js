import { ZodError } from 'zod';
import { ApiError } from '../utils/apiError.js';

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    const body = { message: err.message };
    if (err.code) body.code = err.code;
    if (err.amountAllowable != null) body.amountAllowable = err.amountAllowable;
    return res.status(err.statusCode).json(body);
  }

  if (err instanceof ZodError) {
    const first = err.errors[0];
    return res.status(400).json({
      message: first?.message ?? 'Validation failed',
      code: 'VALIDATION_ERROR',
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Invalid or expired token', code: 'UNAUTHORIZED' });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? 'field';
    return res.status(409).json({
      message: field === 'email' ? 'Email already exists' : 'Duplicate value',
      code: field === 'email' ? 'EMAIL_EXISTS' : 'DUPLICATE',
    });
  }

  console.error(err);
  return res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
}
