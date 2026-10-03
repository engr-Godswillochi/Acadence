import { apiRequest } from '../../services/api.js';

export const adminApi = {
  devices: (token, signal) => apiRequest('/admin/devices', { token, signal }),
  createDevice: (token, body) => apiRequest('/admin/devices', { token, method: 'POST', body }),
  updateDevice: (token, id, body) => apiRequest(`/admin/devices/${id}`, { token, method: 'PATCH', body }),
  rotateDeviceKey: (token, id) => apiRequest(`/admin/devices/${id}/rotate-key`, { token, method: 'POST' }),
  students: (token, query = '', signal) => apiRequest(`/admin/students?q=${encodeURIComponent(query)}`, { token, signal }),
  profiles: (token, signal) => apiRequest('/admin/biometrics', { token, signal }),
  startEnrollment: (token, body) => apiRequest('/admin/biometric-enrolments', { token, method: 'POST', body }),
  enrollmentJob: (token, id, signal) => apiRequest(`/admin/biometric-enrolments/${id}`, { token, signal }),
  cancelEnrollment: (token, id) => apiRequest(`/admin/biometric-enrolments/${id}/cancel`, { token, method: 'POST' }),
  removeProfile: (token, id) => apiRequest(`/admin/biometrics/${id}`, { token, method: 'DELETE' }),
};
