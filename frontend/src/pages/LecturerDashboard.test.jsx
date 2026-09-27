import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LecturerDashboard } from './LecturerDashboard.jsx';
import { coursesApi } from '../features/courses/courses.api.js';
import { schedulesApi } from '../features/schedules/schedules.api.js';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const course = { courseId: 'course-1', courseCode: 'CSC401', courseTitle: 'Software Engineering', creditUnits: 3, academicSession: '2026/2027', semester: 'FIRST' };
const session = (dayOfWeek, startTime, endTime, venue) => ({ scheduleId: `${dayOfWeek}-${startTime}`, courseId: 'course-1', dayOfWeek, startTime, endTime, venue, courseCode: 'CSC401', courseTitle: 'Software Engineering' });

function mount({ teaching = { schedules: [] } } = {}) {
  vi.spyOn(schedulesApi, 'teaching').mockResolvedValue(teaching);
  render(<MemoryRouter><LecturerDashboard token="test-token" user={{ fullName: 'Amina Bello' }} logout={vi.fn()} /></MemoryRouter>);
}

test('first course can be created directly from the empty dashboard', async () => {
  vi.spyOn(coursesApi, 'list').mockResolvedValueOnce({ courses: [] }).mockResolvedValue({ courses: [course] });
  const create = vi.spyOn(coursesApi, 'create').mockResolvedValue({ course });
  mount();
  await userEvent.click(await screen.findByRole('button', { name: 'Create your first course' }));
  await userEvent.type(screen.getByLabelText('Course code'), course.courseCode);
  await userEvent.type(screen.getByLabelText('Course title'), course.courseTitle);
  await userEvent.type(screen.getByLabelText('Academic session'), course.academicSession);
  await userEvent.click(screen.getByRole('button', { name: 'Save course' }));
  expect(await screen.findByRole('link', { name: course.courseTitle })).toBeTruthy();
  expect(create).toHaveBeenCalledWith('test-token', { courseCode: 'CSC401', courseTitle: 'Software Engineering', creditUnits: 3, academicSession: '2026/2027', semester: 'FIRST' });
  expect(screen.queryByRole('button', { name: 'Create your first course' })).toBeNull();
});

test('course shortcuts open the corresponding course section', async () => {
  vi.spyOn(coursesApi, 'list').mockResolvedValue({ courses: [course] });
  mount();
  expect((await screen.findByRole('link', { name: 'Attendance' })).getAttribute('href')).toBe('/courses/course-1?section=attendance');
  expect(screen.getByRole('link', { name: 'Assignments' }).getAttribute('href')).toBe('/courses/course-1?section=assignments');
});

test('the banner greets the lecturer by name and reports their real teaching load', async () => {
  vi.spyOn(coursesApi, 'list').mockResolvedValue({ courses: [course, { ...course, courseId: 'course-2', courseCode: 'VIS402', creditUnits: 2 }] });
  mount();
  expect((await screen.findByRole('heading', { level: 1 })).textContent).toMatch(/^Good (morning|afternoon|evening), Amina\.$/);
  expect(screen.getByText('2 courses · 5 credit units · 2026/2027 session.')).toBeTruthy();
  const codes = screen.getByRole('list', { name: 'Courses on your desk' });
  expect([...codes.querySelectorAll('li')].map((item) => item.textContent)).toEqual(['CSC401', 'VIS402']);
});

test('an empty desk is announced in the singular and offers no course codes', async () => {
  vi.spyOn(coursesApi, 'list').mockResolvedValue({ courses: [] });
  mount();
  expect((await screen.findByRole('heading', { level: 1 })).textContent).toMatch(/^Good (morning|afternoon|evening), Amina\.$/);
  expect(screen.getByText(/No courses on your desk yet\./)).toBeTruthy();
  expect(screen.queryByRole('list', { name: 'Courses on your desk' })).toBeNull();
});

test('a single course reads in the singular', async () => {
  vi.spyOn(coursesApi, 'list').mockResolvedValue({ courses: [{ ...course, creditUnits: 1 }] });
  mount();
  expect(await screen.findByText('1 course · 1 credit unit · 2026/2027 session.')).toBeTruthy();
});

test('the teaching week shows the lecturer’s own classes, with the next one in focus', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date('2026-09-28T08:00:00.000Z'));
  try {
    vi.spyOn(coursesApi, 'list').mockResolvedValue({ courses: [course] });
    mount({ teaching: { schedules: [session('Monday', '14:00', '15:30', 'Room 12'), session('Monday', '16:00', '17:00', 'Lab 1'), session('Wednesday', '09:00', '10:30', 'Studio 2')] } });
    expect(await screen.findByRole('heading', { name: 'Your teaching week' })).toBeTruthy();

    // Monday 09:00 WAT: the 14:00 class is still ahead, the Wednesday class is not today.
    const next = screen.getByText('Next class').closest('article');
    expect(next.textContent).toContain('Today');
    expect(next.textContent).toContain('14:00–15:30');
    expect(next.textContent).toContain('Room 12');
    expect(screen.getByRole('link', { name: 'Open schedule' }).getAttribute('href')).toBe('/courses/course-1?section=schedule');

    // The grid opens on Monday, marks today, and every class links to its own course.
    expect(screen.getByRole('heading', { name: /Mon.*Today/ })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Tue' })).toBeTruthy();
    expect(screen.getByText('Studio 2')).toBeTruthy();
    expect(screen.getByText('Lab 1')).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'CSC401' })).toHaveLength(3);
  } finally {
    vi.useRealTimers();
  }
});

test('the overview counts only what the API actually returned', async () => {
  vi.spyOn(coursesApi, 'list').mockResolvedValue({ courses: [course, { ...course, courseId: 'course-2', courseCode: 'VIS402', creditUnits: 2 }] });
  mount({ teaching: { schedules: [session('Monday', '09:00', '10:30', 'Room 12'), session('Tuesday', '16:00', '17:00', 'Lab 1'), session('Wednesday', '09:00', '10:30', 'Studio 2')] } });
  const tile = (label) => screen.getByText(label).closest('div').querySelector('dd').textContent;
  expect(await screen.findByText('Classes per week')).toBeTruthy();
  expect(tile('Classes per week')).toBe('3');
  expect(tile('Days with classes')).toBe('3');
  expect(tile('Across your courses')).toBe('5');
});

test('a lecturer with courses but no timetable is told so plainly', async () => {
  vi.spyOn(coursesApi, 'list').mockResolvedValue({ courses: [course] });
  mount({ teaching: { schedules: [] } });
  expect(await screen.findByText(/No class times yet\./)).toBeTruthy();
  expect(screen.queryByRole('heading', { name: 'Mon' })).toBeNull();
  expect(screen.queryByText('Next class')).toBeNull();
});

test('a timetable failure leaves the courses reachable', async () => {
  vi.spyOn(coursesApi, 'list').mockResolvedValue({ courses: [course] });
  vi.spyOn(schedulesApi, 'teaching').mockRejectedValue(new Error('Timetable unavailable.'));
  render(<MemoryRouter><LecturerDashboard token="test-token" user={{ fullName: 'Amina Bello' }} logout={vi.fn()} /></MemoryRouter>);
  // The week is a convenience; losing it must not cost the lecturer their courses.
  expect((await screen.findByText(/Timetable unavailable\./)).getAttribute('role')).toBe('alert');
  expect(screen.getByRole('link', { name: course.courseTitle })).toBeTruthy();
});
