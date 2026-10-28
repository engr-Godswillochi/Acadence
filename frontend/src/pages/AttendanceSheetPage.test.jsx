import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../features/auth/auth.context.js';
import { AttendanceSheetPage } from './AttendanceSheetPage.jsx';
import { attendanceSheetCsv } from '../features/attendance/attendanceSheet.utils.js';
import { CourseAttendance } from '../features/attendance/CourseAttendance.jsx';
import { attendanceApi } from '../features/attendance/attendance.api.js';
import { coursesApi } from '../features/courses/courses.api.js';

afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

const course = { courseId: 'course-1', courseCode: 'CSC401', courseTitle: 'Software Engineering' };
const closedSession = { sessionId: 'session-1', courseId: 'course-1', status: 'CLOSED', openedAt: '2026-10-27T08:00:00Z', expiresAt: '2026-10-27T08:15:00Z', closedAt: '2026-10-27T08:15:00Z' };
const records = [
  { studentId: 's1', studentName: 'Ada Obi', matricNumber: '2022/241218', recordedAt: '2026-10-27T08:03:00Z' },
  { studentId: 's2', studentName: 'Bayo Lawal', matricNumber: '2022/246002', recordedAt: null },
  { studentId: 's3', studentName: 'Chika Eze', matricNumber: null, recordedAt: null },
];

function mount(session, recordList = records) {
  vi.spyOn(coursesApi, 'get').mockResolvedValue({ course });
  const sessionSpy = vi.spyOn(attendanceApi, 'session').mockResolvedValue({ session });
  const recordSpy = vi.spyOn(attendanceApi, 'records').mockResolvedValue({ records: recordList });
  render(<AuthContext.Provider value={{ token: 'test-token', user: { role: 'LECTURER' }, logout: vi.fn() }}>
    <MemoryRouter initialEntries={['/courses/course-1/attendance/session-1']}>
      <Routes><Route path="courses/:id/attendance/:sessionId" element={<AttendanceSheetPage />} /></Routes>
    </MemoryRouter>
  </AuthContext.Provider>);
  return { sessionSpy, recordSpy };
}

test('closed session sheet lists every enrolled student with present and absent totals', async () => {
  mount(closedSession);
  const table = await screen.findByRole('table');
  expect(screen.getByText('Closed')).toBeTruthy();
  expect(within(table).getAllByRole('row')).toHaveLength(4);
  expect(within(table).getByRole('rowheader', { name: 'Ada Obi' })).toBeTruthy();
  expect(within(table).getByText('Present')).toBeTruthy();
  expect(within(table).getAllByText('Absent')).toHaveLength(2);
  expect(screen.getByText('33%')).toBeTruthy();
  expect(screen.getByText('Enrolled at opening').nextSibling.textContent).toBe('3');
});

test('filters and search narrow the sheet', async () => {
  const user = userEvent.setup();
  mount(closedSession);
  const table = await screen.findByRole('table');
  await user.click(screen.getByRole('button', { name: 'Absent (2)' }));
  expect(within(table).queryByText('Ada Obi')).toBeNull();
  expect(within(table).getByText('Bayo Lawal')).toBeTruthy();
  await user.type(screen.getByLabelText('Search students'), 'chika');
  expect(within(table).queryByText('Bayo Lawal')).toBeNull();
  expect(within(table).getByText('Chika Eze')).toBeTruthy();
  await user.type(screen.getByLabelText('Search students'), 'zzz');
  expect(within(table).getByText('No students match this view.')).toBeTruthy();
});

test('live session sheet shows waiting students and keeps refreshing until it closes', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const liveSession = { ...closedSession, status: 'ACTIVE', closedAt: null, expiresAt: '2026-10-27T08:30:00Z' };
  const { sessionSpy, recordSpy } = mount(liveSession);
  const table = await screen.findByRole('table');
  expect(screen.getByText('Live')).toBeTruthy();
  expect(within(table).getAllByText('Waiting')).toHaveLength(2);
  expect(screen.getByText('Not yet recorded')).toBeTruthy();

  sessionSpy.mockResolvedValue({ session: closedSession });
  recordSpy.mockResolvedValue({ records: records.map((record) => ({ ...record, recordedAt: record.recordedAt ?? '2026-10-27T08:10:00Z' })) });
  await vi.advanceTimersByTimeAsync(5000);
  await waitFor(() => expect(screen.getByText('Closed')).toBeTruthy());
  expect(within(table).getAllByText('Present')).toHaveLength(3);
  const calls = recordSpy.mock.calls.length;
  await vi.advanceTimersByTimeAsync(10000);
  expect(recordSpy.mock.calls.length).toBe(calls);
});

test('a session from another course is not shown under this course', async () => {
  mount({ ...closedSession, courseId: 'course-2' });
  expect((await screen.findByRole('alert')).textContent).toMatch(/not found for this course/);
  expect(screen.queryByRole('table')).toBeNull();
});

test('CSV export carries the sheet columns and escapes values', () => {
  const csv = attendanceSheetCsv([...records, { studentId: 's4', studentName: 'Doe, "J"', matricNumber: 'X', recordedAt: null }]);
  const lines = csv.split('\n');
  expect(lines[0]).toBe('#,Student name,Matric number,Status,Time recorded');
  expect(lines[1]).toMatch(/^1,Ada Obi,2022\/241218,Present,\d\d:\d\d WAT$/);
  expect(lines[3]).toBe('3,Chika Eze,,Absent,');
  expect(lines[4]).toBe('4,"Doe, ""J""",X,Absent,');
});

test('course attendance links live and past sessions to their sheets', async () => {
  const active = { ...closedSession, sessionId: 'session-2', status: 'ACTIVE', expiresAt: new Date(Date.now() + 600000).toISOString(), closedAt: null };
  vi.spyOn(attendanceApi, 'sessions').mockResolvedValue({ sessions: [active, { ...closedSession, presentCount: 1, eligibleCount: 3 }] });
  vi.spyOn(attendanceApi, 'devices').mockResolvedValue({ devices: [] });
  vi.spyOn(attendanceApi, 'records').mockResolvedValue({ records });
  render(<AuthContext.Provider value={{ token: 'test-token', user: { role: 'LECTURER' }, logout: vi.fn() }}><MemoryRouter><CourseAttendance courseId="course-1" /></MemoryRouter></AuthContext.Provider>);
  expect((await screen.findByRole('link', { name: 'Open attendance sheet' })).getAttribute('href')).toBe('/courses/course-1/attendance/session-2');
  expect(screen.getByRole('link', { name: /View attendance sheet for/ }).getAttribute('href')).toBe('/courses/course-1/attendance/session-1');
});
