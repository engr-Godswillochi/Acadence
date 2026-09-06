import { useEffect, useState } from 'react';
import { useAuth } from '../features/auth/useAuth.js';
import { NotificationContext } from '../features/notifications/notification.context.js';
import { listenForNotifications, notificationsApi } from '../features/notifications/notifications.api.js';

export function NotificationProvider({ children }) {
  const { token, logout } = useAuth();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ token: null, notifications: [], unreadCount: 0, error: '' });
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    notificationsApi.list(token, controller.signal).then((data) => setState({ token, ...data, error: '' })).catch((failure) => {
      if (controller.signal.aborted) return;
      if (failure.status === 401) logout(); else setState({ token, notifications: [], unreadCount: 0, error: failure.message });
    });
    return () => controller.abort();
  }, [token, logout, revision]);
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    let timer;
    async function connect() {
      try { await listenForNotifications(token, controller.signal, () => setRevision((value) => value + 1)); }
      catch (failure) { if (failure.status === 401) { logout(); return; } }
      if (!controller.signal.aborted) timer = setTimeout(connect, 3000);
    }
    connect();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [token, logout]);
  const current = state.token === token ? state : { notifications: [], unreadCount: 0, error: '', loading: true };
  return <NotificationContext.Provider value={{ ...current, refresh: () => setRevision((value) => value + 1) }}>{children}</NotificationContext.Provider>;
}
