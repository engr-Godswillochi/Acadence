import { useEffect, useState } from 'react';
import { useAuth } from '../features/auth/useAuth.js';
import { NotificationContext } from '../features/notifications/notification.context.js';
import { notificationsApi } from '../features/notifications/notifications.api.js';

const pollingIntervalMs = 15000;

export function NotificationProvider({ children }) {
  const { token, logout } = useAuth();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ token: null, notifications: [], unreadCount: 0, error: '' });

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    async function load() {
      try {
        const data = await notificationsApi.list(token, controller.signal);
        setState({ token, ...data, error: '' });
      } catch (failure) {
        if (controller.signal.aborted) return;
        if (failure.status === 401) logout();
        else setState((current) => ({ ...current, token, error: failure.message }));
      }
    }

    load();
    const timer = window.setInterval(load, pollingIntervalMs);
    const refreshVisiblePage = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', refreshVisiblePage);

    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshVisiblePage);
    };
  }, [token, logout, revision]);

  const current = state.token === token ? state : { notifications: [], unreadCount: 0, error: '', loading: true };
  return <NotificationContext.Provider value={{ ...current, refresh: () => setRevision((value) => value + 1) }}>{children}</NotificationContext.Provider>;
}
