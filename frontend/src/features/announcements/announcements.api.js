import { apiRequest } from '../../services/api.js';
export const announcementsApi = {
  list: (token, courseId, signal) => apiRequest(courseId ? `/courses/${courseId}/announcements` : '/announcements/my', { token, signal }),
  create: (token, courseId, body) => apiRequest(`/courses/${courseId}/announcements`, { token, method: 'POST', body }),
  update: (token, id, body) => apiRequest(`/announcements/${id}`, { token, method: 'PATCH', body }),
  remove: (token, id) => apiRequest(`/announcements/${id}`, { token, method: 'DELETE' }),
};
