import { ApiError } from '../../utils/apiError.js';
import { authRepository } from './auth.repository.js';
import { passwordService } from './auth.password.js';
import { tokenService } from './auth.token.js';

export function createAuthService({ repository = authRepository, passwords = passwordService, tokens = tokenService } = {}) {
  let dummyHash;
  function session(user) {
    const publicUser = { ...user };
    delete publicUser.passwordHash;
    return { accessToken: tokens.create(publicUser), user: publicUser };
  }

  return {
    async register(input) {
      if (!['STUDENT', 'LECTURER'].includes(input.role)) {
        throw new ApiError(403, 'FORBIDDEN', 'This role cannot register publicly.');
      }
      const passwordHash = await passwords.hash(input.password);
      try {
        const user = await repository.createUser({ ...input, passwordHash });
        return session(user);
      } catch (error) {
        if (error.code === '23505') {
          throw new ApiError(409, 'ACCOUNT_ALREADY_EXISTS', 'An account with these details already exists.');
        }
        throw error;
      }
    },
    async login({ email, password }) {
      const user = await repository.findUserByEmail(email);
      // Missing accounts still perform bcrypt verification to reduce account enumeration by timing.
      dummyHash ??= passwords.hash('unused-account-verification');
      const valid = await passwords.verify(password, user?.passwordHash ?? await dummyHash);
      if (!user || !valid) {
        throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
      }
      return session(user);
    },
    async authenticate(token) {
      let identity;
      try {
        identity = tokens.verify(token);
      } catch {
        throw new ApiError(401, 'UNAUTHORIZED', 'Your session is invalid or expired. Please sign in again.');
      }
      const user = await repository.findUserById(identity.userId);
      if (!user) throw new ApiError(401, 'UNAUTHORIZED', 'Please sign in again.');
      // Read the current role from the database so role changes take effect immediately.
      return user;
    },
  };
}
