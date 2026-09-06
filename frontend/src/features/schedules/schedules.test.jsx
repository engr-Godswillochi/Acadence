import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../auth/auth.context.js';
import { schedulesApi } from './schedules.api.js';
import { assignmentsApi } from '../assignments/assignments.api.js';
import { CalendarPage } from '../../pages/CalendarPage.jsx';
import { ScheduleForm } from './ScheduleForm.jsx';
import { localDateKey, shiftWeek, weekDates } from './calendar.utils.js';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('shows recurring classes and deadlines together and navigates weeks', async () => {
  const today = localDateKey(new Date());
  vi.spyOn(schedulesApi, 'my').mockResolvedValue({ schedules: [{ scheduleId: 's1', courseId: 'c1', courseCode: 'CSC401', dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00', venue: 'Lab 2' }] });
  vi.spyOn(assignmentsApi, 'my').mockResolvedValue({ assignments: [{ assignmentId: 'a1', courseCode: 'CSC401', title: 'Database report', deadline: `${today}T12:00:00Z`, status: 'PENDING' }] });
  render(<MemoryRouter><AuthContext.Provider value={{ token: 'test', logout: vi.fn() }}><CalendarPage /></AuthContext.Provider></MemoryRouter>);
  expect(await screen.findByText('Database report')).toBeTruthy();
  expect(screen.getByText('Lab 2')).toBeTruthy();
  fireEvent.click(screen.getByText('Next week'));
  expect(screen.queryByText('Database report')).toBeNull();
  expect(screen.getByText('Lab 2')).toBeTruthy();
  fireEvent.click(screen.getByText('This week'));
  expect(screen.getByText('Database report')).toBeTruthy();
});

describe('calendar dates', () => {
  it('uses Lagos dates across UTC midnight and year boundaries', () => {
    expect(localDateKey('2026-12-31T23:30:00Z')).toBe('2027-01-01');
    expect(weekDates('2027-01-01')[0].date).toBe('2026-12-28');
    expect(weekDates('2027-01-03')[6].day).toBe('Sunday');
    expect(shiftWeek('2026-12-28', 1)).toBe('2027-01-04');
  });
});
describe('schedule form', () => {
  it('rejects reversed times and preserves drafts after a server failure', async () => {
    const save = vi.fn().mockRejectedValue(new Error('Connection interrupted'));
    render(<ScheduleForm save={save} cancel={() => {}} />);
    fireEvent.change(screen.getByLabelText('Venue'), { target: { value: 'Room 7' } });
    fireEvent.change(screen.getByLabelText('End time'), { target: { value: '08:00' } });
    fireEvent.click(screen.getByText('Save schedule'));
    expect((await screen.findByRole('alert')).textContent).toContain('Start time must be before end time');
    expect(save).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('End time'), { target: { value: '10:00' } });
    fireEvent.click(screen.getByText('Save schedule'));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Connection interrupted'));
    expect(screen.getByLabelText('Venue').value).toBe('Room 7');
  });
});
