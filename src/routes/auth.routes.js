import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authMiddleware, loadUserMiddleware } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimit.js';
import { signupSchema, loginSchema } from '../validators/auth.js';
import * as authController from '../controllers/authController.js';

const router = Router();

router.post('/signup', authRateLimiter, validate(signupSchema), authController.signup);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, loadUserMiddleware, authController.me);

export default router;
