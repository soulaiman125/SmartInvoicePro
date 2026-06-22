import { asyncHandler } from '../utils/asyncHandler.js';
import * as productService from '../services/product.service.js';

export const list = asyncHandler(async (req, res) => {
  res.json(await productService.listProducts(req.user.organizationId, req.query));
});

export const get = asyncHandler(async (req, res) => {
  res.json(await productService.getProduct(req.user.organizationId, req.params.id));
});

export const categories = asyncHandler(async (req, res) => {
  res.json(await productService.listCategories(req.user.organizationId));
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json(await productService.createProduct(req.user.organizationId, req.body));
});

export const update = asyncHandler(async (req, res) => {
  res.json(await productService.updateProduct(req.user.organizationId, req.params.id, req.body));
});

export const remove = asyncHandler(async (req, res) => {
  res.json(await productService.deleteProduct(req.user.organizationId, req.params.id));
});
