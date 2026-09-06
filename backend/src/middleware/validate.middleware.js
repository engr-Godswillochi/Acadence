import { ApiError } from '../utils/apiError.js';

export function validateBody(schema) {
  return function bodyValidationMiddleware(request, response, next) {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      next(
        new ApiError(400, 'VALIDATION_ERROR', 'Please correct the invalid request fields.', {
          details: result.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        }),
      );
      return;
    }

    request.validatedBody = result.data;
    next();
  };
}
