import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import { createAuthenticateUser, createOptionalUser } from '../../middleware/auth.middleware.js';
import { enrolmentLinkController as links } from './enrolment.controller.js';

export function createEnrolmentLinkRouter(authService) {
  const router = Router();
  const auth = createAuthenticateUser(authService);
  // The token is unguessable, but this is a public unauthenticated write path,
  // so it gets the same guard as sign-in attempts.
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many attempts. Try again in 15 minutes.' } },
  });
  router.use((request, response, next) => {
    response.set('Cache-Control', 'no-store');
    next();
  });
  router.get('/:token', createOptionalUser(authService), links.preview);
  router.post('/:token/redeem', limiter, auth, links.redeem);
  return router;
}
