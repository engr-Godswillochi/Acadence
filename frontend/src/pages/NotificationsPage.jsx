import { useState } from 'react';
import { useAuth } from '../features/auth/useAuth.js';
import { useNotifications } from '../features/notifications/notification.context.js';
import { notificationsApi } from '../features/notifications/notifications.api.js';

export function NotificationsPage() {
  const { token } = useAuth();
  const { notifications, unreadCount, loading, error, refresh } = useNotifications();
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  async function mark(id) {
    setBusy(true); setFailure('');
    try { if (id) await notificationsApi.read(token, id); else await notificationsApi.readAll(token); refresh(); }
    catch (problem) { setFailure(problem.message); }
    finally { setBusy(false); }
  }
  return <section><div className="page-heading"><div><p className="eyebrow">Academic activity</p><h1 className="page-title">Notifications</h1><p className="page-intro">{unreadCount} unread · Showing up to 100 recent notifications</p></div><button disabled={busy || !unreadCount} onClick={() => mark()}>Mark all read</button></div>
    {(error || failure) && <div role="alert"><p>{error || failure}</p><button onClick={refresh}>Try again</button></div>}
    {loading ? <p role="status">Loading notifications…</p> : !notifications.length && !error ? <p className="empty-state">No notifications yet.</p> : <ul className="task-list">{notifications.map((item) => <li key={item.notificationId}><h2>{item.title}</h2><p className="assignment-description">{item.message}</p><p>{new Date(item.createdAt).toLocaleString()} · {item.isRead ? 'Read' : 'Unread'}</p>{!item.isRead && <button className="secondary" disabled={busy} onClick={() => mark(item.notificationId)}>Mark read</button>}</li>)}</ul>}
  </section>;
}
