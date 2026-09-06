import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

function normalizeError(error) {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return new ApiError(400, 'INVALID_JSON', 'The request body contains invalid JSON.');
  }

  return new ApiError(500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred.');
}

export function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    next(error);
    return;
  }

  const apiError = normalizeError(error);

  if (apiError.statusCode >= 500 && env.nodeEnv !== 'test') {
    console.error({
      message: 'Unhandled server error',
      method: request.method,
      path: request.path,
      errorType: error.name,
    });
  }

  const errorBody = {
    code: apiError.code,
    message: apiError.message,
  };

  if (apiError.details) {
    errorBody.details = apiError.details;
  }

  response.status(apiError.statusCode).json({
    success: false,
    error: errorBody,
  });
}
