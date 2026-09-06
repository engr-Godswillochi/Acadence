import { ApiError } from '../utils/apiError.js';

export function requireRole(...roles) {
  return function authorizeRole(request, response, next) {
    if (!request.user) return next(new ApiError(401, 'UNAUTHORIZED', 'Please sign in to continue.'));
    if (!roles.includes(request.user.role)) return next(new ApiError(403, 'FORBIDDEN', 'You do not have access to this resource.'));
    next();
  };
}
