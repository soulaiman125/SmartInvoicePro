import { Router } from 'express';
import * as clientController from '../controllers/client.controller.js';
import * as portalController from '../controllers/portal.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { canWrite, adminOnly } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { idParam } from '../validators/common.validator.js';
import { createClientSchema, updateClientSchema } from '../validators/client.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', clientController.list);
router.get('/:id', validate(idParam), clientController.get);
router.post('/', canWrite, validate(createClientSchema), clientController.create);
router.put('/:id', canWrite, validate(updateClientSchema), clientController.update);
router.delete('/:id', adminOnly, validate(idParam), clientController.remove);

// Customer-portal link management.
router.get('/:id/portal-links', validate(idParam), portalController.listLinks);
router.post('/:id/portal-links', canWrite, validate(idParam), portalController.createLink);
router.delete('/:id/portal-links/:linkId', canWrite, portalController.revokeLink);

export default router;
