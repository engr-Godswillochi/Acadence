import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth.js';

export function ProtectedRoute({ roles }) {
  const auth = useAuth();
  const location = useLocation();
  if (auth.status === 'loading') return <p role="status">Restoring your session…</p>;
  if (auth.status === 'error') return <section><h1>Connection unavailable</h1><p role="alert">{auth.error}</p><button onClick={auth.retry}>Try again</button><button onClick={auth.logout}>Sign out</button></section>;
  if (!auth.user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (roles && !roles.includes(auth.user.role)) return <section><h1>Access restricted</h1><p>Your account does not have access to this page.</p></section>;
  return <Outlet />;
}
