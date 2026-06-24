import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';
import * as userService from '../services/user.service.js';

export const signup = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json(result);
});

export const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(req.body.refreshToken);
  res.json(result);
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body?.refreshToken);
  res.status(204).send();
});

export const logoutAll = asyncHandler(async (req, res) => {
  const result = await authService.logoutAll(req.user.id);
  res.json(result);
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.requestPasswordReset(req.body.email);
  // Same generic response whether or not the email exists.
  res.json({
    message: 'If an account exists for that email, a reset link has been sent.',
    ...(result.devResetToken ? { devResetToken: result.devResetToken } : {}),
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.password);
  res.json({ message: 'Password has been reset. Please log in.' });
});

export const me = asyncHandler(async (req, res) => {
  const profile = await authService.getProfile(req.user.id, req.user.organizationId);
  res.json(profile);
});

export const updateMe = asyncHandler(async (req, res) => {
  const updated = await userService.updateProfile(req.user.id, req.body);
  res.json(updated);
});

export const organizations = asyncHandler(async (req, res) => {
  res.json(await authService.listOrganizations(req.user.id));
});

export const switchOrganization = asyncHandler(async (req, res) => {
  res.json(await authService.switchOrganization(req.user.id, req.body.organizationId));
});

export const createOrganization = asyncHandler(async (req, res) => {
  res.status(201).json(await authService.createOrganization(req.user.id, req.body));
});
