import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext } from '../auth/auth.context.js';
import { NotificationContext } from './notification.context.js';
import { NotificationsPage } from '../../pages/NotificationsPage.jsx';
import { notificationsApi } from './notifications.api.js';
import { AnnouncementForm } from '../announcements/AnnouncementForm.jsx';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
test('marking a notification read refreshes the persisted inbox', async () => {
  const read = vi.spyOn(notificationsApi, 'read').mockResolvedValue({});
  const refresh = vi.fn();
  render(<AuthContext.Provider value={{ token: 'test-token' }}><NotificationContext.Provider value={{ notifications: [{ notificationId: 'notice', title: 'Class update', message: 'Room 4', isRead: false, createdAt: '2026-09-06T12:00:00Z' }], unreadCount: 1, refresh }}><NotificationsPage /></NotificationContext.Provider></AuthContext.Provider>);
  await userEvent.click(screen.getByRole('button', { name: 'Mark read' }));
  expect(read).toHaveBeenCalledWith('test-token', 'notice');
  expect(refresh).toHaveBeenCalled();
});
test('announcement publication preserves a failed draft', async () => {
  render(<AnnouncementForm initial={{ title: 'Room change', message: 'Meet in room 4' }} save={async () => { throw new Error('Connection unavailable'); }} cancel={() => {}} />);
  await userEvent.click(screen.getByRole('button', { name: 'Publish announcement' }));
  expect((await screen.findByRole('alert')).textContent).toBe('Connection unavailable');
  expect(screen.getByLabelText('Message').value).toBe('Meet in room 4');
});
