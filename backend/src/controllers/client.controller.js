import { asyncHandler } from '../utils/asyncHandler.js';
import * as clientService from '../services/client.service.js';

export const list = asyncHandler(async (req, res) => {
  res.json(await clientService.listClients(req.user.organizationId, req.query));
});

export const get = asyncHandler(async (req, res) => {
  res.json(await clientService.getClient(req.user.organizationId, req.params.id));
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json(await clientService.createClient(req.user.organizationId, req.body));
});

export const update = asyncHandler(async (req, res) => {
  res.json(await clientService.updateClient(req.user.organizationId, req.params.id, req.body));
});

export const remove = asyncHandler(async (req, res) => {
  const result = await clientService.deleteClient(req.user.organizationId, req.params.id);
  if (result) return res.json({ archived: true, client: result });
  return res.status(204).send();
});
