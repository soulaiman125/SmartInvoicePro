import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize, adminOnly } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { idParam } from '../validators/common.validator.js';
import { inviteSchema, updateRoleSchema } from '../validators/user.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', userController.list);
router.get('/:id', validate(idParam), userController.get);

// Membership & role management is restricted to owners/admins.
router.post('/invite', adminOnly, validate(inviteSchema), userController.invite);
router.patch('/:id/role', adminOnly, validate(updateRoleSchema), userController.updateRole);
router.delete('/:id', authorize('owner', 'admin'), validate(idParam), userController.remove);

export default router;
