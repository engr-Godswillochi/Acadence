const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const frontendEnv = Object.freeze({
  apiBaseUrl: configuredApiBaseUrl || 'http://localhost:3000/api',
});
