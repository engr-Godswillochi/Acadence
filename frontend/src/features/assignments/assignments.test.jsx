import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../auth/auth.context.js';
import { AssignmentsPage } from '../../pages/AssignmentsPage.jsx';
import { assignmentsApi } from './assignments.api.js';
import { AssignmentForm } from './AssignmentForm.jsx';
import { CourseAssignments } from './CourseAssignments.jsx';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const task = { assignmentId: 'task-1', courseId: 'course-1', courseCode: 'CSC401', title: 'Database design', deadline: '2026-10-01T12:00:00Z', difficultyRating: 3, status: 'PENDING', isOverdue: false, priorityLabel: 'HIGH' };
function mount(path = '/assignments') { render(<MemoryRouter initialEntries={[path]}><AuthContext.Provider value={{ token: 'test-token', logout: vi.fn() }}><AssignmentsPage /></AuthContext.Provider></MemoryRouter>); }
test('completion updates the personal task and filters completed work', async () => {
  vi.spyOn(assignmentsApi, 'my').mockResolvedValueOnce({ assignments: [task] }).mockResolvedValue({ assignments: [{ ...task, status: 'COMPLETED' }] });
  const update = vi.spyOn(assignmentsApi, 'setStatus').mockResolvedValue({ status: 'COMPLETED' });
  mount();
  await userEvent.click(await screen.findByRole('button', { name: 'Mark completed' }));
  expect(await screen.findByRole('button', { name: 'Mark pending' })).toBeTruthy();
  expect(update).toHaveBeenCalledWith('test-token', 'task-1', 'COMPLETED');
  await userEvent.selectOptions(screen.getByLabelText('Status'), 'PENDING');
  expect(screen.getByText('No assignments match this view.')).toBeTruthy();
});
test('the overdue filter uses the server-provided task status', async () => {
  vi.spyOn(assignmentsApi, 'my').mockResolvedValue({ assignments: [{ ...task, isOverdue: true }] });
  mount();
  await screen.findByText('Database design');
  await userEvent.selectOptions(screen.getByLabelText('Status'), 'OVERDUE');
  expect(screen.getByText('Overdue · HIGH priority')).toBeTruthy();
});
test('an assignment deep link bypasses filters, focuses its row, and supports clearing an invalid target', async () => {
  const secondTask = { ...task, assignmentId: 'task-2', title: 'Systems review', status: 'COMPLETED' };
  vi.spyOn(assignmentsApi, 'my').mockResolvedValue({ assignments: [task, secondTask] });
  mount('/assignments?assignment=task-2&status=COMPLETED');
  await screen.findByText('Systems review');
  const target = document.getElementById('assignment-task-2');
  expect(target).toBeTruthy();
  expect(target.className).toContain('is-focused');
  await waitFor(() => expect(document.activeElement).toBe(target));

  vi.spyOn(assignmentsApi, 'my').mockResolvedValue({ assignments: [task] });
  cleanup();
  mount('/assignments?assignment=missing');
  await screen.findByText('That assignment is not available.');
  await userEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
  expect(screen.queryByText('That assignment is not available.')).toBeNull();
});
test('assignment form retains its description after a failed save', async () => {
  const save = vi.fn().mockRejectedValue(new Error('A future deadline is required.'));
  render(<AssignmentForm initial={{ ...task, description: 'Original instructions' }} onSave={save} onCancel={() => {}} />);
  await userEvent.click(screen.getByRole('button', { name: 'Save assignment' }));
  expect((await screen.findByRole('alert')).textContent).toContain('future deadline');
  expect(screen.getByLabelText('Description').value).toBe('Original instructions');
});
test('students do not see the lecturer-facing student view note', async () => {
  vi.spyOn(assignmentsApi, 'course').mockResolvedValue({ assignments: [task] });
  render(<MemoryRouter><AuthContext.Provider value={{ token: 'test-token', user: { role: 'STUDENT' }, logout: vi.fn() }}><CourseAssignments courseId="course-1" /></AuthContext.Provider></MemoryRouter>);
  expect(await screen.findByText('Database design')).toBeTruthy();
  expect(screen.queryByRole('heading', { name: 'Student view' })).toBeNull();
});
