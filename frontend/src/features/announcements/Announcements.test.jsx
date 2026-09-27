import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext } from '../auth/auth.context.js';
import { Announcements } from './Announcements.jsx';
import { announcementsApi } from './announcements.api.js';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const visible = {
  announcementId: 'visible-notice',
  courseId: 'course-1',
  courseCode: 'COS 452',
  title: 'Course registration',
  message: 'Use the official course code.',
  createdAt: '2026-09-25T10:54:00.000Z',
};

const hidden = {
  announcementId: 'hidden-notice',
  courseId: 'course-1',
  courseCode: 'COS 452',
  title: 'Earlier room change',
  message: 'The class moved rooms.',
  createdAt: '2026-09-24T10:54:00.000Z',
};

function mount(role, courseId) {
  return render(<AuthContext.Provider value={{ token: 'test-token', user: { role }, logout: vi.fn() }}><Announcements courseId={courseId} /></AuthContext.Provider>);
}

test('a student can dismiss a notice privately and restore hidden notices', async () => {
  vi.spyOn(announcementsApi, 'list').mockResolvedValue({ announcements: [visible] });
  vi.spyOn(announcementsApi, 'listHidden').mockResolvedValue({ announcements: [hidden] });
  const dismiss = vi.spyOn(announcementsApi, 'dismiss').mockResolvedValue({});
  const restore = vi.spyOn(announcementsApi, 'restore').mockResolvedValue({});
  mount('STUDENT');

  expect(await screen.findByText('Course registration')).toBeTruthy();
  const hiddenSection = screen.getByRole('region', { name: 'Hidden notices' });
  expect(within(hiddenSection).getByText('Earlier room change')).toBeTruthy();

  await userEvent.click(screen.getByRole('button', { name: 'Dismiss for me' }));
  await waitFor(() => expect(dismiss).toHaveBeenCalledWith('test-token', 'visible-notice'));
  expect(within(hiddenSection).getByText('Course registration')).toBeTruthy();

  const earlier = within(hiddenSection).getByText('Earlier room change').closest('li');
  await userEvent.click(within(earlier).getByRole('button', { name: 'Restore' }));
  await waitFor(() => expect(restore).toHaveBeenCalledWith('test-token', 'hidden-notice'));
  expect(await screen.findByRole('heading', { name: 'Earlier room change' })).toBeTruthy();
});

test('a lecturer sees an explicit system-wide withdrawal action', async () => {
  vi.spyOn(announcementsApi, 'list').mockResolvedValue({ announcements: [visible] });
  const hiddenList = vi.spyOn(announcementsApi, 'listHidden').mockResolvedValue({ announcements: [] });
  mount('LECTURER', 'course-1');

  expect(await screen.findByText('Course registration')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Dismiss for me' })).toBeNull();
  expect(hiddenList).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: 'Withdraw for everyone' }));
  expect(screen.getByRole('dialog')).toBeTruthy();
  expect(screen.getByText(/removed for everyone enrolled/i)).toBeTruthy();
});
