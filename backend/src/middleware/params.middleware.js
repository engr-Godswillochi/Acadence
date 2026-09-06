import { z } from 'zod';
import { ApiError } from '../utils/apiError.js';

export function validateIds(...names) {
  return (request, response, next) => {
    if (names.some((name) => !z.uuid().safeParse(request.params[name]).success)) {
      return next(new ApiError(400, 'VALIDATION_ERROR', 'A resource identifier is invalid.'));
    }
    next();
  };
}
