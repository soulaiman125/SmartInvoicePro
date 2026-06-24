import { Router } from 'express';
import * as invoiceController from '../controllers/invoice.controller.js';
import * as emailController from '../controllers/email.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { canWrite } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { idParam } from '../validators/common.validator.js';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  cancelInvoiceSchema,
} from '../validators/invoice.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', invoiceController.list);
router.post('/process-overdue', canWrite, invoiceController.processOverdue);
router.get('/:id', validate(idParam), invoiceController.get);
router.get('/:id/pdf', validate(idParam), invoiceController.pdf);
router.post('/', canWrite, validate(createInvoiceSchema), invoiceController.create);
router.put('/:id', canWrite, validate(updateInvoiceSchema), invoiceController.update);
router.post('/:id/email', canWrite, validate(idParam), emailController.sendInvoice);
router.post('/:id/reminder', canWrite, validate(idParam), emailController.sendInvoiceReminder);
router.post('/:id/issue', canWrite, validate(idParam), invoiceController.issue);
router.post('/:id/cancel', canWrite, validate(cancelInvoiceSchema), invoiceController.cancel);
router.delete('/:id', canWrite, validate(idParam), invoiceController.remove);

export default router;
