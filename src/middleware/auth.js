import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { unauthorized } from '../utils/apiError.js';
import { User } from '../models/User.js';

export function authMiddleware(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(unauthorized());
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    next(unauthorized());
  }
}

export async function loadUserMiddleware(req, _res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return next(unauthorized());
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
