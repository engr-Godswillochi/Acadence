import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, BookOpen, CalendarDays, ClipboardCheck, Cpu, Fingerprint, LayoutDashboard, LogOut, Megaphone, Menu, X } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth.js';
import { useNotifications } from '../../features/notifications/notification.context.js';
import { BrandMark } from '../brand/BrandMark.jsx';

export function AppShell() {
  const { user, logout } = useAuth();
  const notifications = useNotifications();
  const location = useLocation();
  const menuButton = useRef(null);
  const navigation = useRef(null);
  const header = useRef(null);
  const locationKey = `${location.pathname}${location.search}`;
  const isEnrolmentRoute = location.pathname.startsWith('/enrol/');
  const [menuState, setMenuState] = useState({ locationKey, open: false });
  const menuOpen = menuState.locationKey === locationKey && menuState.open;
  const closeMenu = useCallback(() => setMenuState({ locationKey, open: false }), [locationKey]);
  const navigationClass = ({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`;
  const roleLabel = user?.role === 'STUDENT' ? 'Student' : user?.role === 'LECTURER' ? 'Lecturer' : 'Administrator';

  useEffect(() => {
    if (!menuOpen) return undefined;
    navigation.current?.querySelector('a')?.focus();
    // The drawer is modal, so the page behind it must not scroll and Tab must
    // stay inside it. Escape and the scrim are the ways out.
    const scrollbar = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return;
      closeMenu();
      menuButton.current?.focus();
    };
    const holdTabInside = (event) => {
      if (event.key !== 'Tab') return;
      const focusable = [...(navigation.current?.querySelectorAll('a[href], button:not([disabled])') ?? [])];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const closeOnOutsidePointer = (event) => {
      if (header.current?.contains(event.target)) return;
      closeMenu();
    };
    const closeOnResize = () => closeMenu();
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('keydown', holdTabInside);
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    window.addEventListener('resize', closeOnResize);
    return () => {
      document.body.style.overflow = scrollbar;
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('keydown', holdTabInside);
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      window.removeEventListener('resize', closeOnResize);
    };
  }, [menuOpen, closeMenu]);

  return (
    <div className={`app-shell${user ? ' authenticated-shell' : ' public-shell'}`}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <div ref={header} className="header-inner">
          {/* The wordmark returns a signed-in user to their own work, the way it
              did when "/" redirected to the dashboard. The marketing landing page
              is for signed-out visitors. */}
          <Link className="brand" to={user ? '/dashboard' : '/'} aria-label="Acadence home" onClick={closeMenu}>
            <BrandMark className="brand-mark" />
            <span className="brand-copy"><strong>Acadence</strong><small>Campus workspace</small></span>
          </Link>
          {user && <button ref={menuButton} type="button" className="mobile-menu" aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuState({ locationKey, open: !menuOpen })}>{menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}<span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span></button>}
          {user && <nav ref={navigation} id="main-navigation" className={`main-nav${menuOpen ? ' is-open' : ''}`} role={menuOpen ? 'dialog' : undefined} aria-modal={menuOpen ? 'true' : undefined} aria-label="Main navigation" onClick={(event) => { if (event.target.closest?.('a')) closeMenu(); }}>
            {menuOpen ? <div className="nav-drawer-head"><p className="nav-drawer-title">Acadence</p><button type="button" className="nav-drawer-close" aria-label="Close menu" onClick={() => { closeMenu(); menuButton.current?.focus(); }}><X aria-hidden="true" /></button></div> : null}
            <NavLink className={navigationClass} to="/dashboard"><LayoutDashboard aria-hidden="true" /><span className="nav-label">Dashboard</span></NavLink>
            {user.role !== 'ADMIN' && <NavLink className={navigationClass} to="/courses"><BookOpen aria-hidden="true" /><span className="nav-label">Courses</span></NavLink>}
            {user.role === 'STUDENT' && <>
              <NavLink className={navigationClass} to="/assignments"><ClipboardCheck aria-hidden="true" /><span className="nav-label">Assignments</span></NavLink>
              <NavLink className={navigationClass} to="/calendar"><CalendarDays aria-hidden="true" /><span className="nav-label">Calendar</span></NavLink>
              <NavLink className={navigationClass} to="/announcements"><Megaphone aria-hidden="true" /><span className="nav-label">Announcements</span></NavLink>
              <NavLink className={navigationClass} to="/attendance"><Fingerprint aria-hidden="true" /><span className="nav-label">Attendance</span></NavLink>
            </>}
            {user.role === 'ADMIN' && <>
              <NavLink className={navigationClass} to="/admin/devices"><Cpu aria-hidden="true" /><span className="nav-label">Devices</span></NavLink>
              <NavLink className={navigationClass} to="/admin/biometrics"><Fingerprint aria-hidden="true" /><span className="nav-label">Fingerprints</span></NavLink>
            </>}
            <NavLink className={navigationClass} to="/notifications"><Bell aria-hidden="true" /><span className="nav-label">Notifications</span>{notifications?.unreadCount ? <span className="notification-count">{notifications.unreadCount}</span> : null}</NavLink>
            <button type="button" className="mobile-sign-out" onClick={() => { closeMenu(); logout(); }}><LogOut aria-hidden="true" />Sign out</button>
          </nav>}
          {user && <NavLink className="account-link" to="/account" aria-label={`Open account for ${user.fullName}`} onClick={closeMenu}>
            <span className="account-initial" aria-hidden="true">{user.fullName.slice(0, 1)}</span>
            <span className="account-link-text"><strong>{user.fullName}</strong><small>{roleLabel}</small></span>
          </NavLink>}
        </div>
        {user && menuOpen ? <div className="nav-scrim" aria-hidden="true" onClick={closeMenu} /> : null}
      </header>
      <main className={`page-content${isEnrolmentRoute ? ' enrol-page-host' : ''}`} id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
