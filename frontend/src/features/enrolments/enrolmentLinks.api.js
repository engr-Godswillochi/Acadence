import { apiRequest } from '../../services/api.js';

// The public side of a shareable enrolment link. `preview` works signed out — the
// course behind the link has to be readable before anyone has an account — while
// `redeem` is a signed-in student action.
export const enrolmentLinksApi = {
  preview: (token, linkToken, signal) => apiRequest(`/enrolment-links/${encodeURIComponent(linkToken)}`, { token, signal }),
  redeem: (token, linkToken) => apiRequest(`/enrolment-links/${encodeURIComponent(linkToken)}/redeem`, { token, method: 'POST' }),
};
