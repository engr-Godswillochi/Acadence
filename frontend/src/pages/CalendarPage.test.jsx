import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthContext } from '../features/auth/auth.context.js';
import { assignmentsApi } from '../features/assignments/assignments.api.js';
import { schedulesApi } from '../features/schedules/schedules.api.js';
import { CalendarPage } from './CalendarPage.jsx';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
}

function mount(path) {
  render(<MemoryRouter initialEntries={[path]}><AuthContext.Provider value={{ token: 'test-token', logout: vi.fn() }}><Routes><Route path="/calendar" element={<><CalendarPage /><LocationProbe /></>} /></Routes></AuthContext.Provider></MemoryRouter>);
}

test('calendar keeps the selected week in the URL and navigates by seven days', async () => {
  vi.spyOn(schedulesApi, 'my').mockResolvedValue({ schedules: [] });
  vi.spyOn(assignmentsApi, 'my').mockResolvedValue({ assignments: [] });
  mount('/calendar?week=2026-01-07');
  expect(await screen.findByText(/5 Jan 2026/)).toBeTruthy();
  expect(screen.getByText(/11 Jan 2026/)).toBeTruthy();
  expect(screen.getByTestId('location').textContent).toBe('/calendar?week=2026-01-07');

  await userEvent.click(screen.getByRole('button', { name: 'Next week' }));
  expect(screen.getByTestId('location').textContent).toBe('/calendar?week=2026-01-14');
  expect(await screen.findByText(/12 Jan 2026/)).toBeTruthy();
});
