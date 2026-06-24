import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import clientRoutes from './client.routes.js';
import productRoutes from './product.routes.js';
import inventoryRoutes from './inventory.routes.js';
import invoiceRoutes from './invoice.routes.js';
import quotationRoutes from './quotation.routes.js';
import paymentRoutes from './payment.routes.js';
import analyticsRoutes from './analytics.routes.js';
import notificationRoutes from './notification.routes.js';
import settingsRoutes from './settings.routes.js';
import emailRoutes from './email.routes.js';
import portalRoutes from './portal.routes.js';
import reportRoutes from './report.routes.js';
import expenseRoutes from './expense.routes.js';
import recurringRoutes from './recurring.routes.js';
import auditRoutes from './audit.routes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'smartinvoice-api', time: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/clients', clientRoutes);
router.use('/products', productRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/quotations', quotationRoutes);
router.use('/payments', paymentRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/settings', settingsRoutes);
router.use('/emails', emailRoutes);
router.use('/portal', portalRoutes);
router.use('/reports', reportRoutes);
router.use('/expenses', expenseRoutes);
router.use('/recurring-invoices', recurringRoutes);
router.use('/audit-logs', auditRoutes);

export default router;
