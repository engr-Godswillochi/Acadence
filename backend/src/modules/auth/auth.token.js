import jsonwebtoken from 'jsonwebtoken';

import { env } from '../../config/env.js';
import { USER_ROLES } from '../users/user.constants.js';

const validRoles = new Set(Object.values(USER_ROLES));

export function createTokenService({ secret = env.jwtSecret, expiresIn = env.jwtExpiresIn } = {}) {
  function requireSecret() {
    if (!secret) {
      throw new Error('JWT_SECRET is not configured.');
    }
  }

  return Object.freeze({
    create(user) {
      requireSecret();
      return jsonwebtoken.sign({ role: user.role }, secret, {
        algorithm: 'HS256',
        expiresIn,
        subject: user.userId,
      });
    },
    verify(token) {
      requireSecret();
      const payload = jsonwebtoken.verify(token, secret, { algorithms: ['HS256'] });

      if (typeof payload === 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.sub ?? '') || !validRoles.has(payload.role) || !Number.isFinite(payload.exp)) {
        throw new Error('JWT payload is invalid.');
      }

      return {
        userId: payload.sub,
        role: payload.role,
      };
    },
  });
}

export const tokenService = createTokenService();
