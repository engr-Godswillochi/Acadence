import { formatAcademicDate } from '../utils/date.js';
import { useState } from 'react';
import { Bell, Check, CheckCheck, ClipboardCheck, Clock3, Fingerprint, MapPin } from 'lucide-react';
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
  function notificationIcon(item) { const text = `${item.title} ${item.message}`.toLowerCase(); if (text.includes('attendance')) return Fingerprint; if (text.includes('assignment')) return ClipboardCheck; if (text.includes('room') || text.includes('class')) return MapPin; return Bell; }
  return <section className="notifications-workspace"><header className="notifications-heading page-banner"><div><h1>Notifications</h1><p>{unreadCount ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'} need your attention.` : 'You are up to date.'}</p></div><button aria-label="Mark all read" disabled={busy || !unreadCount} onClick={() => mark()}><CheckCheck size={17} aria-hidden="true" /><span>Mark all read</span></button></header>
    {(error || failure) && <div role="alert"><p>{error || failure}</p><button onClick={refresh}>Try again</button></div>}
    {loading ? <p role="status">Loading notifications…</p> : !notifications.length && !error ? <div className="notifications-empty"><Bell size={25} aria-hidden="true" /><div><h2>No notifications yet.</h2><p>Updates from your courses will appear here.</p></div></div> : <ul className="notification-register">{notifications.map((item) => { const Icon = notificationIcon(item); return <li key={item.notificationId} className={item.isRead ? 'is-read' : 'is-unread'}><span className="notification-icon"><Icon size={19} aria-hidden="true" /></span><div><h2>{item.title}</h2><p>{item.message}</p><time><Clock3 size={14} aria-hidden="true" />{formatAcademicDate(item.createdAt)}</time></div>{!item.isRead ? <button className="secondary" aria-label="Mark read" disabled={busy} onClick={() => mark(item.notificationId)}><Check size={15} aria-hidden="true" /><span>Mark read</span></button> : <span className="notification-read-state"><Check size={15} aria-hidden="true" />Read</span>}</li>; })}</ul>}
  </section>;
}
