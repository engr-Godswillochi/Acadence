import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext } from '../auth/auth.context.js';
import { AttendancePage } from '../../pages/AttendancePage.jsx';
import { CourseAttendance } from './CourseAttendance.jsx';
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

test('lecturer chooses a time frame when opening attendance', async () => {
  const user = userEvent.setup();
  vi.spyOn(attendanceApi, 'sessions').mockResolvedValue({ sessions: [] });
  vi.spyOn(attendanceApi, 'devices').mockResolvedValue({ devices: [{ deviceId: 'device-1', deviceName: 'Lab reader', location: 'Lab 1' }] });
  const open = vi.spyOn(attendanceApi, 'open').mockResolvedValue({ session: {} });

  render(<AuthContext.Provider value={{ token: 'test-token', user: { role: 'LECTURER' }, logout: vi.fn() }}><CourseAttendance courseId="course-1" /></AuthContext.Provider>);

  await screen.findByRole('option', { name: /Lab reader/ });
  await user.selectOptions(screen.getByLabelText('Attendance time frame'), '30');
  await user.click(screen.getByRole('button', { name: 'Open attendance' }));

  await waitFor(() => expect(open).toHaveBeenCalledWith('test-token', 'course-1', { deviceId: 'device-1', durationMinutes: 30 }));
});
