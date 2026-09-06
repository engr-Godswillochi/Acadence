import { apiRequest } from '../../services/api.js';

export const attendanceApi = {
  sessions: (token, courseId, signal) => apiRequest(`/courses/${courseId}/attendance-sessions`, { token, signal }),
  devices: (token, signal) => apiRequest('/attendance/devices', { token, signal }),
  open: (token, courseId, body) => apiRequest(`/courses/${courseId}/attendance-sessions`, { token, method: 'POST', body }),
  close: (token, id) => apiRequest(`/attendance-sessions/${id}/close`, { token, method: 'PATCH' }),
  records: (token, id, signal) => apiRequest(`/attendance-sessions/${id}/records`, { token, signal }),
  my: (token, signal) => apiRequest('/attendance/my', { token, signal }),
  summary: (token, signal) => apiRequest('/attendance/my/summary', { token, signal }),
};
