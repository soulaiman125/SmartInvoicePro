import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  switchOrgSchema,
  createOrgSchema,
} from '../validators/auth.validator.js';

const router = Router();

router.post('/signup', validate(registerSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.post('/logout', authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);

router.get('/me', authenticate, authController.me);
router.patch('/me', authenticate, validate(updateProfileSchema), authController.updateMe);

router.get('/organizations', authenticate, authController.organizations);
router.post('/organizations', authenticate, validate(createOrgSchema), authController.createOrganization);
router.post('/switch-organization', authenticate, validate(switchOrgSchema), authController.switchOrganization);

export default router;
