import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth.js';
import { useNotifications } from '../../features/notifications/notification.context.js';

export function AppShell() {
  const { user } = useAuth();
  const notifications = useNotifications();
  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="Acadence home">
          <span className="brand-mark" aria-hidden="true">
            A
          </span>
          <span>Acadence</span>
        </Link>
        {user && <nav aria-label="Main navigation">{user.role !== 'ADMIN' && <Link to="/courses">Courses</Link>}{user.role === 'STUDENT' && <><Link to="/assignments">Assignments</Link><Link to="/announcements">Announcements</Link></>}<Link to="/notifications">Notifications{notifications?.unreadCount ? ` (${notifications.unreadCount})` : ''}</Link><Link to="/account">Account</Link></nav>}
      </header>

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}
