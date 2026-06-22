import { Router } from 'express';
import * as portalController from '../controllers/portal.controller.js';

// Public customer-portal routes. Access is granted by the opaque token in the
// URL only — there is intentionally no authenticate middleware here.
const router = Router();

router.get('/:token', portalController.data);
router.get('/:token/invoices/:id/pdf', portalController.invoicePdf);
router.get('/:token/quotes/:id/pdf', portalController.quotePdf);

export default router;
