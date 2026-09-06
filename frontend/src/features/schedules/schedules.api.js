import { apiRequest } from '../../services/api.js';

export const schedulesApi = {
  course: (token, id, signal) => apiRequest(`/courses/${id}/schedules`, { token, signal }),
  my: (token, signal) => apiRequest('/schedules/my', { token, signal }),
  create: (token, id, body) => apiRequest(`/courses/${id}/schedules`, { token, method: 'POST', body }),
  update: (token, id, body) => apiRequest(`/schedules/${id}`, { token, method: 'PATCH', body }),
  remove: (token, id) => apiRequest(`/schedules/${id}`, { token, method: 'DELETE' }),
};
