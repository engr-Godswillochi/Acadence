import { Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from '../components/layout/AppShell.jsx';
import { AuthPage } from '../pages/AuthPage.jsx';
import { AccountPage } from '../pages/AccountPage.jsx';
import { ProtectedRoute } from '../features/auth/ProtectedRoute.jsx';
import { NotFoundPage } from '../pages/NotFoundPage.jsx';
import { CoursesPage } from '../pages/CoursesPage.jsx';
import { CourseDetailsPage } from '../pages/CourseDetailsPage.jsx';
import { AssignmentsPage } from '../pages/AssignmentsPage.jsx';
import { NotificationsPage } from '../pages/NotificationsPage.jsx';
import { Announcements } from '../features/announcements/Announcements.jsx';
import { CalendarPage } from '../pages/CalendarPage.jsx';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/account" replace />} />
        <Route path="login" element={<AuthPage key="login" mode="login" />} />
        <Route path="register" element={<AuthPage key="register" mode="register" />} />
        <Route element={<ProtectedRoute />}><Route path="account" element={<AccountPage />} /></Route>
        <Route element={<ProtectedRoute roles={['LECTURER', 'STUDENT']} />}>
          <Route path="courses" element={<CoursesPage />} />
          <Route path="courses/:id" element={<CourseDetailsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
        <Route element={<ProtectedRoute roles={['STUDENT']} />}><Route path="assignments" element={<AssignmentsPage />} /></Route>
        <Route element={<ProtectedRoute roles={['STUDENT']} />}><Route path="announcements" element={<Announcements />} /></Route>
        <Route element={<ProtectedRoute roles={['STUDENT']} />}><Route path="calendar" element={<CalendarPage />} /></Route>
        <Route element={<ProtectedRoute />}><Route path="notifications" element={<NotificationsPage />} /></Route>
      </Route>
    </Routes>
  );
}
