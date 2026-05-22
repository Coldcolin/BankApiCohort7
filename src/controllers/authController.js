import * as authService from '../services/authService.js';

export async function signup(req, res, next) {
  try {
    const result = await authService.signup(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const refreshToken = req.body?.refreshToken;
    const result = await authService.logout(req.userId, refreshToken);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const result = await authService.getMe(req.user);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
