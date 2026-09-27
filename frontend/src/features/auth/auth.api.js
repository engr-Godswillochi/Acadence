import { apiRequest } from '../../services/api.js';

export const authApi = {
  login: (body) => apiRequest('/auth/login', { method: 'POST', body }),
  register: (body) => apiRequest('/auth/register', { method: 'POST', body }),
  registerAdmin: (body) => apiRequest('/auth/admin/register', { method: 'POST', body }),
  me: (token, signal) => apiRequest('/auth/me', { token, signal }),
};
