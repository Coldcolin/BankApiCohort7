import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authMiddleware, loadUserMiddleware } from '../middleware/auth.js';
import { transferSchema } from '../validators/auth.js';
import * as transferController from '../controllers/transferController.js';

const router = Router();

router.use(authMiddleware, loadUserMiddleware);
router.post('/', validate(transferSchema), transferController.createTransfer);

export default router;
