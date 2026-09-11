import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth.js';
import { useNotifications } from '../../features/notifications/notification.context.js';

export function AppShell() {
  const { user } = useAuth();
  const notifications = useNotifications();
  const navigationClass = ({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`;
  const roleLabel = user?.role === 'STUDENT' ? 'Student' : user?.role === 'LECTURER' ? 'Lecturer' : 'Administrator';
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/" aria-label="Acadence home">
            <span className="brand-mark" aria-hidden="true">A</span>
            <span>Acadence</span>
          </Link>
          {user && <nav className="main-nav" aria-label="Main navigation">
            <NavLink className={navigationClass} to="/dashboard">Dashboard</NavLink>
            {user.role !== 'ADMIN' && <NavLink className={navigationClass} to="/courses">Courses</NavLink>}
            {user.role === 'STUDENT' && <>
              <NavLink className={navigationClass} to="/assignments">Assignments</NavLink>
              <NavLink className={navigationClass} to="/calendar">Calendar</NavLink>
              <NavLink className={navigationClass} to="/announcements">Announcements</NavLink>
              <NavLink className={navigationClass} to="/attendance">Attendance</NavLink>
            </>}
            <NavLink className={navigationClass} to="/notifications">Notifications{notifications?.unreadCount ? <span className="notification-count">{notifications.unreadCount}</span> : null}</NavLink>
          </nav>}
          {user && <NavLink className="account-link" to="/account" aria-label="Open account">
            <span className="account-initial" aria-hidden="true">{user.fullName.slice(0, 1)}</span>
            <span className="account-link-text"><strong>{user.fullName}</strong><small>{roleLabel}</small></span>
          </NavLink>}
        </div>
      </header>
      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}
