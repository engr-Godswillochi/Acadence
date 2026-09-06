import { apiRequest } from '../../services/api.js';

export const coursesApi = {
  list: (token, signal) => apiRequest('/courses', { token, signal }),
  get: (token, id, signal) => apiRequest(`/courses/${id}`, { token, signal }),
  create: (token, body) => apiRequest('/courses', { token, method: 'POST', body }),
  update: (token, id, body) => apiRequest(`/courses/${id}`, { token, method: 'PATCH', body }),
  archive: (token, id) => apiRequest(`/courses/${id}`, { token, method: 'DELETE' }),
  students: (token, id, signal) => apiRequest(`/courses/${id}/students`, { token, signal }),
  enrol: (token, id, studentEmail) => apiRequest(`/courses/${id}/enrolments`, { token, method: 'POST', body: { studentEmail } }),
  remove: (token, id, studentId) => apiRequest(`/courses/${id}/enrolments/${studentId}`, { token, method: 'DELETE' }),
};
