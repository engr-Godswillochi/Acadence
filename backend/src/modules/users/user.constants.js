export const USER_ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  LECTURER: 'LECTURER',
  STUDENT: 'STUDENT',
});

export const PUBLIC_REGISTRATION_ROLES = Object.freeze([
  USER_ROLES.STUDENT,
  USER_ROLES.LECTURER,
]);
