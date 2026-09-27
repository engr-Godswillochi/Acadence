import { ApiError } from '../utils/apiError.js';

export function createAuthenticateUser(authService) {
  return async function authenticateUser(request, response, next) {
    const match = /^Bearer ([^\s]+)$/i.exec(request.get('Authorization') ?? '');
    if (!match) throw new ApiError(401, 'UNAUTHORIZED', 'Please sign in to continue.');
    request.user = await authService.authenticate(match[1]);
    next();
  };
}

// For public pages that get *more* with an identity (an enrolment link shows whether
// the signed-in student is already on the roster) but must stay readable to a
// visitor who has not signed in yet. A bad token is treated as signed out rather
// than rejected, so a stale session never blocks someone from opening a link.
export function createOptionalUser(authService) {
  return async function optionalUser(request, response, next) {
    const match = /^Bearer ([^\s]+)$/i.exec(request.get('Authorization') ?? '');
    if (!match) return next();
    try {
      request.user = await authService.authenticate(match[1]);
    } catch {
      request.user = null;
    }
    next();
  };
}
