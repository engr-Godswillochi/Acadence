import { ApiError } from '../utils/apiError.js';

export function createAuthenticateUser(authService) {
  return async function authenticateUser(request, response, next) {
    const match = /^Bearer ([^\s]+)$/i.exec(request.get('Authorization') ?? '');
    if (!match) throw new ApiError(401, 'UNAUTHORIZED', 'Please sign in to continue.');
    request.user = await authService.authenticate(match[1]);
    next();
  };
}
