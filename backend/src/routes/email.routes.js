import { Router } from 'express';
import * as emailController from '../controllers/email.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { canWrite } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { idParam } from '../validators/common.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', emailController.history);
router.post('/:id/retry', canWrite, validate(idParam), emailController.retry);

export default router;
