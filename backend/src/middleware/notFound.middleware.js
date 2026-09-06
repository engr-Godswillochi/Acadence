import { ApiError } from '../utils/apiError.js';

export function notFoundHandler(request, response, next) {
  next(new ApiError(404, 'ROUTE_NOT_FOUND', `Cannot ${request.method} ${request.originalUrl}.`));
}
