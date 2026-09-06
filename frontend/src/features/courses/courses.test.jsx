import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../auth/auth.context.js';
import { CoursesPage } from '../../pages/CoursesPage.jsx';
import { CourseForm } from './CourseForm.jsx';
import { EnrolmentPanel } from './EnrolmentPanel.jsx';
import { coursesApi } from './courses.api.js';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function renderCourses(role) {
  return render(<MemoryRouter><AuthContext.Provider value={{ token: 'test-token', user: { role }, logout: vi.fn() }}><CoursesPage /></AuthContext.Provider></MemoryRouter>);
}
test('student sees enrolment empty state without course creation controls', async () => {
  vi.spyOn(coursesApi, 'list').mockResolvedValue({ courses: [] });
  renderCourses('STUDENT');
  expect(await screen.findByText(/You are not enrolled/)).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'New course' })).toBeNull();
});
test('course list offers a retry after a network failure', async () => {
  vi.spyOn(coursesApi, 'list').mockRejectedValueOnce(new Error('Network unavailable')).mockResolvedValue({ courses: [{ courseId: 'test-course', courseCode: 'CSC401', courseTitle: 'Database Systems', creditUnits: 3, academicSession: '2026/2027', semester: 'FIRST' }] });
  renderCourses('LECTURER');
  await screen.findByRole('alert');
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('Database Systems')).toBeTruthy();
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
  vi.spyOn(coursesApi, 'enrol').mockRejectedValue(new Error('No student account matches these details.'));
  render(<EnrolmentPanel token="test-token" courseId="test-course" />);
  await screen.findByText('No students enrolled.');
  await userEvent.type(screen.getByLabelText('Student email'), 'student@example.test');
  await userEvent.click(screen.getByRole('button', { name: 'Enrol student' }));
  expect((await screen.findByRole('alert')).textContent).toContain('No student account');
  expect(screen.getByLabelText('Student email').value).toBe('student@example.test');
});
