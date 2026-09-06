import { Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from '../components/layout/AppShell.jsx';
import { AuthPage } from '../pages/AuthPage.jsx';
import { AccountPage } from '../pages/AccountPage.jsx';
import { ProtectedRoute } from '../features/auth/ProtectedRoute.jsx';
import { NotFoundPage } from '../pages/NotFoundPage.jsx';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/account" replace />} />
        <Route path="login" element={<AuthPage key="login" mode="login" />} />
        <Route path="register" element={<AuthPage key="register" mode="register" />} />
        <Route element={<ProtectedRoute />}><Route path="account" element={<AccountPage />} /></Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
