import { Router } from 'express';
import * as quotationController from '../controllers/quotation.controller.js';
import * as emailController from '../controllers/email.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { canWrite } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { idParam } from '../validators/common.validator.js';
import {
  createQuotationSchema,
  updateQuotationSchema,
  statusSchema,
} from '../validators/quotation.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', quotationController.list);
router.get('/:id', validate(idParam), quotationController.get);
router.get('/:id/pdf', validate(idParam), quotationController.pdf);
router.post('/:id/email', canWrite, validate(idParam), emailController.sendQuote);
router.post('/', canWrite, validate(createQuotationSchema), quotationController.create);
router.put('/:id', canWrite, validate(updateQuotationSchema), quotationController.update);
router.patch('/:id/status', canWrite, validate(statusSchema), quotationController.changeStatus);
router.post('/:id/convert', canWrite, validate(idParam), quotationController.convert);
router.delete('/:id', canWrite, validate(idParam), quotationController.remove);

export default router;
