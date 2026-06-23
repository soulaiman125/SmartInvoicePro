import { Router } from 'express';
import * as expenseController from '../controllers/expense.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { canWrite } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { idParam } from '../validators/common.validator.js';
import { createExpenseSchema, updateExpenseSchema } from '../validators/expense.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', expenseController.list);
router.get('/summary', expenseController.summary);
router.get('/categories', expenseController.categories);
router.get('/:id', validate(idParam), expenseController.get);
router.post('/', canWrite, validate(createExpenseSchema), expenseController.create);
router.put('/:id', canWrite, validate(updateExpenseSchema), expenseController.update);
router.delete('/:id', canWrite, validate(idParam), expenseController.remove);

export default router;
