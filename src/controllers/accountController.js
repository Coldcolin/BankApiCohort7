import * as accountService from '../services/accountService.js';

export async function createAccount(req, res, next) {
  try {
    const result = await accountService.addAccount(req.user, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function listAccounts(req, res, next) {
  try {
    const accounts = await accountService.listAccounts(req.userId);
    res.status(200).json(accounts);
  } catch (err) {
    next(err);
  }
}

export async function lookupAccount(req, res, next) {
  try {
    const result = await accountService.lookupAccount(req.params.accountNumber);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getAccount(req, res, next) {
  try {
    const result = await accountService.getAccountByNumber(
      req.params.accountNumber,
      req.userId
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
