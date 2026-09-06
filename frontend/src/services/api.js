import { frontendEnv } from '../config/env.js';

export class ApiError extends Error {
  constructor(message, status, details = []) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function apiRequest(path, { token, body, signal, ...options } = {}) {
  let response;
  try {
    response = await fetch(`${frontendEnv.apiBaseUrl.replace(/\/$/, '')}${path}`, {
      ...options,
      signal,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Unable to reach the server. Check your connection and try again.', 0);
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(payload?.error?.message || 'The request could not be completed.', response.status, payload?.error?.details);
  if (!payload?.success) throw new ApiError('The server returned an unexpected response.', response.status);
  return payload.data;
}
