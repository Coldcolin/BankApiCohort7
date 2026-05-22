import { Router } from 'express';
import { authMiddleware, loadUserMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { transactionsQuerySchema } from '../validators/auth.js';
import * as transferController from '../controllers/transferController.js';

const router = Router();

router.use(authMiddleware, loadUserMiddleware);
router.get('/', validate(transactionsQuerySchema), transferController.listTransactions);

export default router;
