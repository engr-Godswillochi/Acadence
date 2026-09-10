import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth.js';

export function ProtectedRoute({ roles }) {
  const auth = useAuth();
  const location = useLocation();
  if (auth.status === 'loading') return <section className="state-panel"><span className="loading-mark" aria-hidden="true" /><p role="status">Restoring your workspace…</p></section>;
  if (auth.status === 'error') return <section className="state-panel"><p className="eyebrow">Connection issue</p><h1>We could not reach your workspace.</h1><p role="alert">{auth.error}</p><div className="actions"><button onClick={auth.retry}>Try again</button><button className="secondary" onClick={auth.logout}>Sign out</button></div></section>;
  if (!auth.user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (roles && !roles.includes(auth.user.role)) return <section className="state-panel"><p className="eyebrow">Access restricted</p><h1>This page is not available to your account.</h1><p>Your account does not have access to this page.</p></section>;
  return <Outlet />;
}
