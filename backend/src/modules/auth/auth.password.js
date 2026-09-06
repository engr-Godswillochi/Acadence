import bcrypt from 'bcrypt';

const passwordHashRounds = 12;

export const passwordService = Object.freeze({
  hash(password) {
    return bcrypt.hash(password, passwordHashRounds);
  },
  verify(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
  },
});
