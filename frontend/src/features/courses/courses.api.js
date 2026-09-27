import { apiRequest } from '../../services/api.js';

export const coursesApi = {
  list: (token, signal) => apiRequest('/courses', { token, signal }),
  listArchived: (token, signal) => apiRequest('/courses/archived', { token, signal }),
  get: (token, id, signal) => apiRequest(`/courses/${id}`, { token, signal }),
  create: (token, body) => apiRequest('/courses', { token, method: 'POST', body }),
  update: (token, id, body) => apiRequest(`/courses/${id}`, { token, method: 'PATCH', body }),
  archive: (token, id) => apiRequest(`/courses/${id}`, { token, method: 'DELETE' }),
  unarchive: (token, id) => apiRequest(`/courses/${id}/unarchive`, { token, method: 'POST' }),
  students: (token, id, signal) => apiRequest(`/courses/${id}/students`, { token, signal }),
  enrol: (token, id, studentEmail) => apiRequest(`/courses/${id}/enrolments`, { token, method: 'POST', body: { studentEmail } }),
  remove: (token, id, studentId) => apiRequest(`/courses/${id}/enrolments/${studentId}`, { token, method: 'DELETE' }),
  enrolmentLink: (token, id, signal) => apiRequest(`/courses/${id}/enrolment-link`, { token, signal }),
  issueEnrolmentLink: (token, id) => apiRequest(`/courses/${id}/enrolment-link`, { token, method: 'POST' }),
  revokeEnrolmentLink: (token, id) => apiRequest(`/courses/${id}/enrolment-link`, { token, method: 'DELETE' }),
};
