import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { updateSettingsSchema } from '../validators/settings.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', settingsController.get);
router.put('/', adminOnly, validate(updateSettingsSchema), settingsController.update);

export default router;
