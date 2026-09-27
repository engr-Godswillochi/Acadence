import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { createAuthenticateUser } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { createAuthController } from './auth.controller.js';
import { createAuthService } from './auth.service.js';
import { adminRegistrationSchema, loginSchema, registrationSchema } from './auth.validation.js';

export function createAuthRouter(service = createAuthService()) {
  const router = Router();
  const controller = createAuthController(service);
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many attempts. Try again in 15 minutes.' } },
  });
  const adminRegistrationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many attempts. Try again in 15 minutes.' } },
  });
  router.use((request, response, next) => {
    response.set('Cache-Control', 'no-store');
    next();
  });
  router.post('/register', limiter, validateBody(registrationSchema), controller.register);
  router.post('/admin/register', adminRegistrationLimiter, validateBody(adminRegistrationSchema), controller.registerAdmin);
  router.post('/login', limiter, validateBody(loginSchema), controller.login);
  router.get('/me', createAuthenticateUser(service), controller.me);
  return router;
}
