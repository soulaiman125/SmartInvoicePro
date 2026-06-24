import { Router } from 'express';
import * as recurringController from '../controllers/recurring.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { canWrite } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { idParam } from '../validators/common.validator.js';
import { createRecurringSchema, updateRecurringSchema } from '../validators/recurring.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', recurringController.list);
router.post('/', canWrite, validate(createRecurringSchema), recurringController.create);
router.post('/run', canWrite, recurringController.run);
router.get('/:id', validate(idParam), recurringController.get);
router.put('/:id', canWrite, validate(updateRecurringSchema), recurringController.update);
router.post('/:id/pause', canWrite, validate(idParam), recurringController.pause);
router.post('/:id/resume', canWrite, validate(idParam), recurringController.resume);
router.delete('/:id', canWrite, validate(idParam), recurringController.remove);

export default router;
