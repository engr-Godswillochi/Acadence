import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AuthContext } from '../auth/auth.context.js';
import { AttendancePage } from '../../pages/AttendancePage.jsx';
import { attendanceApi } from './attendance.api.js';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test('student attendance page presents server-provided official summaries and history', async () => {
  vi.spyOn(attendanceApi, 'summary').mockResolvedValue({ summaries: [{ courseId: 'course-1', courseCode: 'CSC401', eligibleSessions: 4, attendedSessions: 3, percentage: 75 }] });
  vi.spyOn(attendanceApi, 'my').mockResolvedValue({ attendance: [{ sessionId: 'session-1', courseCode: 'CSC401', openedAt: '2026-09-07T08:00:00Z', recordedAt: '2026-09-07T08:05:00Z', status: 'CLOSED' }] });
  render(<AuthContext.Provider value={{ token: 'test-token', logout: vi.fn() }}><AttendancePage /></AuthContext.Provider>);
  expect(await screen.findByText('75%')).toBeTruthy();
  expect(screen.getByText('3 of 4 closed sessions')).toBeTruthy();
  expect(screen.getByText(/Present/)).toBeTruthy();
});
