import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { userIdParamSchema } from '../validators/auth.js';
import * as userController from '../controllers/userController.js';

const router = Router();

router.delete('/:userId', authMiddleware, validate(userIdParamSchema), userController.deleteUser);

export default router;
