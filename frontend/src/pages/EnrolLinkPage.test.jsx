import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { AuthContext } from '../features/auth/auth.context.js';
import { AuthProvider } from '../context/AuthContext.jsx';
import { AuthPage } from './AuthPage.jsx';
import { EnrolLinkPage } from './EnrolLinkPage.jsx';
import { enrolmentLinksApi } from '../features/enrolments/enrolmentLinks.api.js';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const preview = (overrides = {}) => ({
  course: { courseId: 'course-1', courseCode: 'CSC401', courseTitle: 'Database Systems', creditUnits: 3, academicSession: '2026/2027', semester: 'FIRST', lecturerName: 'Dr Amina Bello' },
  expiresAt: '2026-10-09T00:00:00.000Z',
  alreadyEnrolled: false,
  viewerRole: null,
  ...overrides,
});

function apiResponse(data, status = 200) {
  return {
    ok: status < 400,
    status,
    json: async () => status < 400
      ? { success: true, data }
      : { success: false, error: { message: data } },
  };
}

function mount({ user = null, token = null } = {}) {
  return render(
    <MemoryRouter initialEntries={['/enrol/link-token']}>
      <AuthContext.Provider value={{ token, user, logout: vi.fn() }}>
        <Routes>
          <Route path="/enrol/:token" element={<EnrolLinkPage />} />
          <Route path="/login" element={<p>Sign in page</p>} />
          <Route path="/register" element={<p>Register page</p>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

test('a signed-out visitor reads the course and is sent to sign in, coming back to the link', async () => {
  const read = vi.spyOn(enrolmentLinksApi, 'preview').mockResolvedValue(preview());
  mount();
  expect(await screen.findByRole('heading', { name: 'CSC401' })).toBeTruthy();
  expect(screen.getByText('Database Systems')).toBeTruthy();
  expect(screen.getByText('Dr Amina Bello')).toBeTruthy();
  expect(read).toHaveBeenCalledWith(null, 'link-token', expect.anything());

  await userEvent.click(screen.getByRole('button', { name: 'Sign in to enrol' }));
  // The student has to keep the link, or a whole class that signed out to look
  // at it would arrive at a sign-in page that forgets where they were going.
  expect(screen.getByText('Sign in page')).toBeTruthy();
});

test('signing in from an invitation returns to its confirmation and can enrol', async () => {
  const student = { fullName: 'Ada Student', role: 'STUDENT', email: 'ada@example.test' };
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options = {}) => {
    if (url.endsWith('/auth/login')) return apiResponse({ accessToken: 'student-token', user: student });
    if (url.endsWith('/enrolment-links/link-token/redeem')) return apiResponse({ enrolment: { enrolmentId: 'e1' }, courseId: 'course-1' });
    if (url.endsWith('/enrolment-links/link-token')) return apiResponse(preview());
    throw new Error(`Unexpected request: ${options.method ?? 'GET'} ${url}`);
  });

  render(
    <MemoryRouter initialEntries={['/enrol/link-token']}>
      <AuthProvider>
        <Routes>
          <Route path="/enrol/:token" element={<EnrolLinkPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/dashboard" element={<p>Dashboard</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );

  await userEvent.click(await screen.findByRole('button', { name: 'Sign in to enrol' }));
  await userEvent.type(screen.getByLabelText('Email address'), student.email);
  await userEvent.type(screen.getByLabelText('Password'), 'password123');
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

  expect(await screen.findByRole('heading', { name: 'Enrol in CSC401' })).toBeTruthy();
  await userEvent.click(screen.getByRole('button', { name: 'Enrol in CSC401' }));
  expect(await screen.findByRole('heading', { name: 'You are enrolled.' })).toBeTruthy();
  expect(fetchMock.mock.calls.some(([url]) => url.endsWith('/enrolment-links/link-token/redeem'))).toBe(true);
});

test('registering from an invitation creates a student account and returns to confirm enrolment', async () => {
  const student = { fullName: 'New Student', role: 'STUDENT', email: 'new.student@example.test' };
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
    if (url.endsWith('/auth/register')) return apiResponse({ accessToken: 'new-student-token', user: student });
    if (url.endsWith('/enrolment-links/link-token')) return apiResponse(preview());
    throw new Error(`Unexpected request: ${url}`);
  });

  render(
    <MemoryRouter initialEntries={['/enrol/link-token']}>
      <AuthProvider>
        <Routes>
          <Route path="/enrol/:token" element={<EnrolLinkPage />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/dashboard" element={<p>Dashboard</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );

  await userEvent.click(await screen.findByRole('button', { name: 'Register as a student' }));
  expect(screen.getByLabelText('Role').value).toBe('STUDENT');
  await userEvent.type(screen.getByLabelText('Full name'), student.fullName);
  await userEvent.type(screen.getByLabelText('Matric number'), 'CSC/2026/001');
  await userEvent.type(screen.getByLabelText('Email address'), student.email);
  await userEvent.type(screen.getByLabelText('Password'), 'password123');
  await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

  expect(await screen.findByRole('heading', { name: 'Enrol in CSC401' })).toBeTruthy();
});

test('a signed-out visitor can register as a student instead', async () => {
  vi.spyOn(enrolmentLinksApi, 'preview').mockResolvedValue(preview());
  mount();
  await userEvent.click(await screen.findByRole('button', { name: 'Register as a student' }));
  expect(screen.getByText('Register page')).toBeTruthy();
});

test('a signed-in student enrols and is told so', async () => {
  vi.spyOn(enrolmentLinksApi, 'preview').mockResolvedValue(preview({ viewerRole: 'STUDENT' }));
  const redeem = vi.spyOn(enrolmentLinksApi, 'redeem').mockResolvedValue({ enrolment: { enrolmentId: 'e1' }, courseId: 'course-1' });
  mount({ user: { role: 'STUDENT' }, token: 'test-token' });
  expect(await screen.findByRole('button', { name: 'Enrol in CSC401' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();

  await userEvent.click(screen.getByRole('button', { name: 'Enrol in CSC401' }));
  expect(redeem).toHaveBeenCalledWith('test-token', 'link-token');
  expect(await screen.findByRole('heading', { name: 'You are enrolled.' })).toBeTruthy();
  expect(screen.getByRole('link', { name: /Open CSC401/ }).getAttribute('href')).toBe('/courses/course-1');
});

test('a student who is already on the roster is not invited to join again', async () => {
  vi.spyOn(enrolmentLinksApi, 'preview').mockResolvedValue(preview({ viewerRole: 'STUDENT', alreadyEnrolled: true }));
  const redeem = vi.spyOn(enrolmentLinksApi, 'redeem').mockResolvedValue({});
  mount({ user: { role: 'STUDENT' }, token: 'test-token' });
  expect(await screen.findByRole('heading', { name: 'You are already on this course.' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: /Enrol/ })).toBeNull();
  expect(redeem).not.toHaveBeenCalled();
});

test('a lecturer following their own link is not offered enrolment', async () => {
  vi.spyOn(enrolmentLinksApi, 'preview').mockResolvedValue(preview({ viewerRole: 'LECTURER' }));
  mount({ user: { role: 'LECTURER' }, token: 'test-token' });
  expect(await screen.findByRole('heading', { name: 'This link is for student accounts.' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: /Enrol in/ })).toBeNull();
});

test('a failed enrolment is reported without losing the invitation', async () => {
  vi.spyOn(enrolmentLinksApi, 'preview').mockResolvedValue(preview({ viewerRole: 'STUDENT' }));
  vi.spyOn(enrolmentLinksApi, 'redeem').mockRejectedValue(new Error('You are already enrolled in this course.'));
  mount({ user: { role: 'STUDENT' }, token: 'test-token' });
  await userEvent.click(await screen.findByRole('button', { name: 'Enrol in CSC401' }));
  expect((await screen.findByText('You are already enrolled in this course.')).getAttribute('role')).toBe('alert');
  expect(screen.getByRole('button', { name: 'Enrol in CSC401' })).toBeTruthy();
});

test('an expired, revoked or mistyped link ends in one honest message', async () => {
  vi.spyOn(enrolmentLinksApi, 'preview').mockRejectedValue(new Error('This enrolment link is no longer valid.'));
  mount();
  expect(await screen.findByRole('heading', { name: 'This link cannot be used.' })).toBeTruthy();
  expect(screen.getByText('This enrolment link is no longer valid.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Register' })).toBeTruthy();
  // Nothing about the course behind a dead link should leak into the page.
  expect(screen.queryByText(/CSC401/)).toBeNull();
});

test('the page states when the link stops working', async () => {
  vi.spyOn(enrolmentLinksApi, 'preview').mockResolvedValue(preview());
  mount();
  expect(await screen.findByText(/This link stops working on/)).toBeTruthy();
});
