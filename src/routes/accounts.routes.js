import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authMiddleware, loadUserMiddleware } from '../middleware/auth.js';
import { addAccountSchema, accountNumberParamSchema } from '../validators/auth.js';
import * as accountController from '../controllers/accountController.js';

const router = Router();

router.use(authMiddleware, loadUserMiddleware);

router.post('/', validate(addAccountSchema), accountController.createAccount);
router.get('/', accountController.listAccounts);
router.get('/lookup/:accountNumber', validate(accountNumberParamSchema), accountController.lookupAccount);
router.get('/:accountNumber', validate(accountNumberParamSchema), accountController.getAccount);

export default router;
