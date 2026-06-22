import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard', analyticsController.dashboard);
router.get('/revenue/monthly', analyticsController.monthlyRevenue);
router.get('/products/performance', analyticsController.productPerformance);

// Reports
router.get('/reports/revenue', analyticsController.revenueReport);
router.get('/reports/clients', analyticsController.clientReport);
router.get('/reports/inventory', analyticsController.inventoryReport);

export default router;
