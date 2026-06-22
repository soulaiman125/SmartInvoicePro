import { Router } from 'express';
import * as inventoryController from '../controllers/inventory.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { canWrite } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { adjustStockSchema, productIdParam } from '../validators/inventory.validator.js';

const router = Router();

router.use(authenticate);

router.get('/movements', inventoryController.allMovements);
router.get('/low-stock', inventoryController.lowStock);
router.get(
  '/products/:productId/movements',
  validate(productIdParam),
  inventoryController.movements,
);
router.post(
  '/products/:productId/adjust',
  canWrite,
  validate(adjustStockSchema),
  inventoryController.adjust,
);

export default router;
