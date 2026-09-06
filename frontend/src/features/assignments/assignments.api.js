import { apiRequest } from '../../services/api.js';

export const assignmentsApi = {
  course: (token, courseId, signal) => apiRequest(`/courses/${courseId}/assignments`, { token, signal }),
  my: (token, signal) => apiRequest('/assignments/my', { token, signal }),
  create: (token, courseId, body) => apiRequest(`/courses/${courseId}/assignments`, { token, method: 'POST', body }),
  update: (token, id, body) => apiRequest(`/assignments/${id}`, { token, method: 'PATCH', body }),
  remove: (token, id) => apiRequest(`/assignments/${id}`, { token, method: 'DELETE' }),
  setStatus: (token, id, status) => apiRequest(`/assignments/${id}/status`, { token, method: 'PATCH', body: { status } }),
};
