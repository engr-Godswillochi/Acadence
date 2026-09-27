import { apiRequest } from '../../services/api.js';

export const notificationsApi = {
  list: (token, signal) => apiRequest('/notifications', { token, signal }),
  read: (token, id) => apiRequest(`/notifications/${id}/read`, { token, method: 'PATCH' }),
  readAll: (token) => apiRequest('/notifications/read-all', { token, method: 'PATCH' }),
};
