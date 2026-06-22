import { ApiError } from '../utils/ApiError.js';

// Role-based access control. Pass the roles allowed to access the route.
// Example: authorize('owner', 'admin')
export const authorize =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    return next();
  };

// Common presets.
export const canWrite = authorize('owner', 'admin', 'member');
export const adminOnly = authorize('owner', 'admin');
export const ownerOnly = authorize('owner');
