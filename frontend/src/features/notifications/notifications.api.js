import { apiRequest } from '../../services/api.js';
import { frontendEnv } from '../../config/env.js';

export const notificationsApi = {
  list: (token, signal) => apiRequest('/notifications', { token, signal }),
  read: (token, id) => apiRequest(`/notifications/${id}/read`, { token, method: 'PATCH' }),
  readAll: (token) => apiRequest('/notifications/read-all', { token, method: 'PATCH' }),
};

export async function listenForNotifications(token, signal, onEvent) {
  const response = await fetch(`${frontendEnv.apiBaseUrl.replace(/\/$/, '')}/notifications/stream`, { headers: { Authorization: `Bearer ${token}` }, signal });
  if (!response.ok) throw Object.assign(new Error('Notification connection unavailable.'), { status: response.status });
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read();
      if (done) return;
      buffer += decoder.decode(value, { stream: true });
      let boundary;
      while ((boundary = buffer.indexOf('\n\n')) !== -1) {
        const event = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        if (event.startsWith('event:')) onEvent();
      }
    }
  } finally { reader.releaseLock(); }
}
