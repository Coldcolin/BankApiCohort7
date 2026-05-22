import * as transferService from '../services/transferService.js';

export async function createTransfer(req, res, next) {
  try {
    const result = await transferService.transferFunds(req.userId, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function listTransactions(req, res, next) {
  try {
    const transactions = await transferService.getTransactions(
      req.userId,
      req.query.accountId
    );
    res.status(200).json(transactions);
  } catch (err) {
    next(err);
  }
}
