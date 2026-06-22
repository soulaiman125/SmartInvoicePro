import { asyncHandler } from '../utils/asyncHandler.js';
import * as inventoryService from '../services/inventory.service.js';

export const adjust = asyncHandler(async (req, res) => {
  const result = await inventoryService.adjustStock(
    req.user.organizationId,
    req.params.productId,
    req.body,
  );
  res.status(201).json(result);
});

export const movements = asyncHandler(async (req, res) => {
  const result = await inventoryService.listMovements(
    req.user.organizationId,
    req.params.productId,
    req.query,
  );
  res.json(result);
});

export const allMovements = asyncHandler(async (req, res) => {
  const result = await inventoryService.listMovements(req.user.organizationId, null, req.query);
  res.json(result);
});

export const lowStock = asyncHandler(async (req, res) => {
  res.json(await inventoryService.lowStockReport(req.user.organizationId));
});
