import * as userService from '../services/userService.js';

export async function deleteUser(req, res, next) {
  try {
    const result = await userService.deleteUser(req.userId, req.params.userId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
