import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext.jsx';
import { AuthPage } from '../../pages/AuthPage.jsx';
import { AccountPage } from '../../pages/AccountPage.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';

afterEach(() => { cleanup(); sessionStorage.clear(); vi.restoreAllMocks(); });
function response(data, status = 200) { return { ok: status < 400, status, json: async () => status < 400 ? { success: true, data } : { success: false, error: { message: data } } }; }
function mount(path = '/account') {
  return render(<MemoryRouter initialEntries={[path]}><AuthProvider><Routes>
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/register" element={<AuthPage mode="register" />} />
    <Route element={<ProtectedRoute />}><Route path="/account" element={<AccountPage />} /></Route>
  </Routes></AuthProvider></MemoryRouter>);
}

test('protected routes redirect to login and signing in opens the account', async () => {
  const user = { fullName: 'Ada Student', role: 'STUDENT', email: 'ada@example.test' };
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(response({ accessToken: 'test-token', user })).mockResolvedValue(response({ user }));
  mount();
  await userEvent.type(screen.getByLabelText('Email address'), user.email);
  await userEvent.type(screen.getByLabelText('Password'), 'password123');
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  expect(await screen.findByRole('heading', { name: user.fullName })).toBeTruthy();
  expect(sessionStorage.getItem('acadence.accessToken')).toBe('test-token');
  await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeTruthy();
  expect(sessionStorage.getItem('acadence.accessToken')).toBeNull();
});

test('failed login retains form input and exposes an error', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(response('Email or password is incorrect.', 401));
  mount('/login');
  await userEvent.type(screen.getByLabelText('Email address'), 'ada@example.test');
  await userEvent.type(screen.getByLabelText('Password'), 'wrong-password');
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  expect((await screen.findByRole('alert')).textContent).toContain('Email or password is incorrect.');
  expect(screen.getByLabelText('Email address').value).toBe('ada@example.test');
});

test('expired session clears its token and returns to sign in', async () => {
  sessionStorage.setItem('acadence.accessToken', 'expired-token');
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(response('Expired', 401));
  mount();
  expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeTruthy();
  expect(sessionStorage.getItem('acadence.accessToken')).toBeNull();
});

test('temporary session restoration failure preserves the token and supports retry', async () => {
  sessionStorage.setItem('acadence.accessToken', 'test-token');
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Offline')).mockResolvedValue(response({ user: { fullName: 'Ada Student', role: 'STUDENT' } }));
  mount();
  await screen.findByRole('alert');
  expect(sessionStorage.getItem('acadence.accessToken')).toBe('test-token');
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByRole('heading', { name: 'Ada Student' })).toBeTruthy();
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
});

test('registration exposes only student and lecturer roles with the matching identifier', async () => {
  mount('/register');
  expect(screen.getAllByRole('option').map((option) => option.value)).toEqual(['STUDENT', 'LECTURER']);
  expect(screen.getByLabelText('Matric number').required).toBe(true);
  await userEvent.selectOptions(screen.getByLabelText('Role'), 'LECTURER');
  expect(screen.queryByLabelText('Matric number')).toBeNull();
  expect(screen.getByLabelText('Staff number (optional)')).toBeTruthy();
});
