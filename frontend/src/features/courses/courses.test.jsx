import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../auth/auth.context.js';
import { CoursesPage } from '../../pages/CoursesPage.jsx';
import { CourseForm } from './CourseForm.jsx';
import { EnrolmentPanel } from './EnrolmentPanel.jsx';
import { coursesApi } from './courses.api.js';

beforeEach(() => { vi.spyOn(coursesApi, 'listArchived').mockResolvedValue({ courses: [] }); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function renderCourses(role) {
  return render(<MemoryRouter><AuthContext.Provider value={{ token: 'test-token', user: { role }, logout: vi.fn() }}><CoursesPage /></AuthContext.Provider></MemoryRouter>);
}
test('student sees enrolment empty state without course creation controls', async () => {
  vi.spyOn(coursesApi, 'list').mockResolvedValue({ courses: [] });
  renderCourses('STUDENT');
  expect(await screen.findByText(/You are not enrolled/)).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'New course' })).toBeNull();
  expect(coursesApi.listArchived).not.toHaveBeenCalled();
});
test('course list offers a retry after a network failure', async () => {
  vi.spyOn(coursesApi, 'list').mockRejectedValueOnce(new Error('Network unavailable')).mockResolvedValue({ courses: [{ courseId: 'test-course', courseCode: 'CSC401', courseTitle: 'Database Systems', creditUnits: 3, academicSession: '2026/2027', semester: 'FIRST' }] });
  renderCourses('LECTURER');
  await screen.findByRole('alert');
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('Database Systems')).toBeTruthy();
});
test('a lecturer can restore an archived course to the active list', async () => {
  const course = { courseId: 'archived-course', courseCode: 'CSC401', courseTitle: 'Database Systems', creditUnits: 3, academicSession: '2026/2027', semester: 'FIRST', archivedAt: '2026-09-25T12:00:00.000Z' };
  vi.spyOn(coursesApi, 'list').mockResolvedValue({ courses: [] });
  coursesApi.listArchived.mockResolvedValue({ courses: [course] });
  const restore = vi.spyOn(coursesApi, 'unarchive').mockResolvedValue({ course: { ...course, archivedAt: null } });
  renderCourses('LECTURER');

  expect(await screen.findByRole('heading', { name: 'Archived courses' })).toBeTruthy();
  expect(screen.getByText(/CSC401 · Database Systems/)).toBeTruthy();
  await userEvent.click(screen.getByRole('button', { name: 'Unarchive' }));

  await waitFor(() => expect(restore).toHaveBeenCalledWith('test-token', 'archived-course'));
  expect(await screen.findByText('No archived courses.')).toBeTruthy();
  expect(screen.getByRole('link', { name: /Database Systems/ })).toBeTruthy();
});
test('course form sends numeric credit units and preserves input on conflict', async () => {
  const save = vi.fn().mockRejectedValue(new Error('Course already exists'));
  render(<CourseForm onSave={save} onCancel={() => {}} />);
  await userEvent.type(screen.getByLabelText('Course code'), 'CSC401');
  await userEvent.type(screen.getByLabelText('Course title'), 'Database Systems');
  await userEvent.type(screen.getByLabelText('Academic session'), '2026/2027');
  await userEvent.click(screen.getByRole('button', { name: 'Save course' }));
  expect((await screen.findByRole('alert')).textContent).toContain('Course already exists');
  expect(save.mock.calls[0][0].creditUnits).toBe(3);
  expect(screen.getByLabelText('Course code').value).toBe('CSC401');
});
test('enrolment failure preserves the email for correction', async () => {
  vi.spyOn(coursesApi, 'students').mockResolvedValue({ students: [] });
  vi.spyOn(coursesApi, 'enrolmentLink').mockResolvedValue({ link: null, lifetimeDays: 14 });
  vi.spyOn(coursesApi, 'enrol').mockRejectedValue(new Error('No student account matches these details.'));
  render(<EnrolmentPanel token="test-token" courseId="test-course" />);
  await screen.findByText('No students enrolled.');
  await userEvent.type(screen.getByLabelText('Student email'), 'student@example.test');
  await userEvent.click(screen.getByRole('button', { name: 'Enrol student' }));
  expect((await screen.findByText('No student account matches these details.'))).toBeTruthy();
  expect(screen.getByLabelText('Student email').value).toBe('student@example.test');
});

test('a lecturer issues a shareable enrolment link and can copy it', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  // A small stateful stand-in for the API: the link does not exist until it is
  // issued, and then it is what every later read returns.
  let live = null;
  const issue = vi.spyOn(coursesApi, 'issueEnrolmentLink').mockImplementation(async () => {
    live = { token: 'issued-token', expiresAt: '2026-10-09T00:00:00.000Z' };
    return { link: live };
  });
  vi.spyOn(coursesApi, 'students').mockResolvedValue({ students: [] });
  vi.spyOn(coursesApi, 'enrolmentLink').mockImplementation(async () => ({ link: live, lifetimeDays: 14 }));
  render(<EnrolmentPanel token="test-token" courseId="test-course" />);

  expect(await screen.findByText(/No live link\./)).toBeTruthy();
  expect(screen.getByText('Expires after 14 days')).toBeTruthy();
  await userEvent.click(screen.getByRole('button', { name: 'Create enrolment link' }));
  expect(issue).toHaveBeenCalledWith('test-token', 'test-course');

  // The link is only useful if the lecturer can actually read it, so it is shown
  // in full and handed to the clipboard in one action.
  const field = await screen.findByLabelText('Shareable enrolment link');
  expect(field.value).toBe(`${window.location.origin}/enrol/issued-token`);
  expect(await screen.findByText(/Live until/)).toBeTruthy();
  await userEvent.click(screen.getByRole('button', { name: 'Copy link' }));
  expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/enrol/issued-token`);
  expect(await screen.findByRole('button', { name: 'Copied' })).toBeTruthy();
});

test('a refused clipboard leaves the link selected and says so', async () => {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
  vi.spyOn(coursesApi, 'students').mockResolvedValue({ students: [] });
  vi.spyOn(coursesApi, 'enrolmentLink').mockResolvedValue({ link: { token: 'live-token', expiresAt: '2026-10-09T00:00:00.000Z' }, lifetimeDays: 14 });
  render(<EnrolmentPanel token="test-token" courseId="test-course" />);
  const field = await screen.findByLabelText('Shareable enrolment link');
  await userEvent.click(screen.getByRole('button', { name: 'Copy link' }));

  // Automatic copying can be refused outright, so the field is focused and
  // selected instead — the lecturer can still finish the job by hand.
  expect(await screen.findByText(/would not allow automatic copying/)).toBeTruthy();
  expect(document.activeElement).toBe(field);
  expect(field.selectionStart).toBe(0);
  expect(field.selectionEnd).toBe(field.value.length);
});

test('a live link can be replaced and revoked, and revoking asks first', async () => {
  const revoke = vi.spyOn(coursesApi, 'revokeEnrolmentLink').mockResolvedValue({});
  vi.spyOn(coursesApi, 'students').mockResolvedValue({ students: [] });
  vi.spyOn(coursesApi, 'enrolmentLink').mockResolvedValue({ link: { token: 'live-token', expiresAt: '2026-10-09T00:00:00.000Z' }, lifetimeDays: 14 });
  render(<EnrolmentPanel token="test-token" courseId="test-course" />);
  await screen.findByLabelText('Shareable enrolment link');

  await userEvent.click(screen.getByRole('button', { name: 'Revoke' }));
  // Revoking kills a link a whole class may already hold, so it is confirmed.
  expect(await screen.findByRole('dialog')).toBeTruthy();
  expect(screen.getByText(/will no longer be able to enrol/)).toBeTruthy();
  expect(revoke).not.toHaveBeenCalled();

  await userEvent.click(screen.getByRole('button', { name: 'Revoke link' }));
  expect(revoke).toHaveBeenCalledWith('test-token', 'test-course');
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});
