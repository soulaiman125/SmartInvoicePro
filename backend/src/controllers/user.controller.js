import { asyncHandler } from '../utils/asyncHandler.js';
import * as userService from '../services/user.service.js';

export const list = asyncHandler(async (req, res) => {
  const result = await userService.listMembers(req.user.organizationId, req.query);
  res.json(result);
});

export const get = asyncHandler(async (req, res) => {
  const result = await userService.getMember(req.user.organizationId, req.params.id);
  res.json(result);
});

export const invite = asyncHandler(async (req, res) => {
  const result = await userService.inviteMember(req.user.organizationId, req.body);
  res.status(201).json(result);
});

export const updateRole = asyncHandler(async (req, res) => {
  const result = await userService.updateMemberRole(
    req.user.organizationId,
    req.params.id,
    req.body.role,
  );
  res.json(result);
});

export const remove = asyncHandler(async (req, res) => {
  await userService.removeMember(req.user.organizationId, req.params.id, req.user.id);
  res.status(204).send();
});
