import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { canWrite, adminOnly } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { idParam } from '../validators/common.validator.js';
import { createProductSchema, updateProductSchema } from '../validators/product.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', productController.list);
// Must be registered before '/:id' so it isn't captured as an id.
router.get('/categories', productController.categories);
router.get('/:id', validate(idParam), productController.get);
router.post('/', canWrite, validate(createProductSchema), productController.create);
router.put('/:id', canWrite, validate(updateProductSchema), productController.update);
router.delete('/:id', adminOnly, validate(idParam), productController.remove);

export default router;
