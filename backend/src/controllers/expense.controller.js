import { asyncHandler } from '../utils/asyncHandler.js';
import * as expenseService from '../services/expense.service.js';

export const list = asyncHandler(async (req, res) => {
  res.json(await expenseService.listExpenses(req.user.organizationId, req.query));
});

export const summary = asyncHandler(async (req, res) => {
  res.json(await expenseService.expenseSummary(req.user.organizationId, req.query));
});

export const categories = asyncHandler(async (req, res) => {
  res.json(await expenseService.listCategories(req.user.organizationId));
});

export const get = asyncHandler(async (req, res) => {
  res.json(await expenseService.getExpense(req.user.organizationId, req.params.id));
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json(await expenseService.createExpense(req.user.organizationId, req.body));
});

export const update = asyncHandler(async (req, res) => {
  res.json(await expenseService.updateExpense(req.user.organizationId, req.params.id, req.body));
});

export const remove = asyncHandler(async (req, res) => {
  await expenseService.deleteExpense(req.user.organizationId, req.params.id);
  res.status(204).send();
});
