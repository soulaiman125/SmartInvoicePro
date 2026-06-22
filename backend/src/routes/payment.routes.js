import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { canWrite, adminOnly } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { idParam } from '../validators/common.validator.js';
import { recordPaymentSchema, listPaymentsSchema } from '../validators/payment.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', validate(listPaymentsSchema), paymentController.list);
router.get('/invoice/:invoiceId', paymentController.listForInvoice);
router.post(
  '/invoice/:invoiceId',
  canWrite,
  validate(recordPaymentSchema),
  paymentController.record,
);
router.get('/:id', validate(idParam), paymentController.get);
router.post('/:id/refund', adminOnly, validate(idParam), paymentController.refund);

export default router;
