import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { AuthContext } from '../auth/auth.context.js';
import { AdminDashboard } from '../../pages/AdminDashboard.jsx';
import { AdminDevicesPage } from '../../pages/AdminDevicesPage.jsx';
import { AdminBiometricsPage } from '../../pages/AdminBiometricsPage.jsx';
import { adminApi } from './admin.api.js';
import { deviceConnection } from './admin.utils.js';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const auth = { token: 'admin-token', user: { role: 'ADMIN', fullName: 'System Admin' }, logout: vi.fn() };
const device = { deviceId: 'd1', deviceName: 'Engineering entrance', location: 'Block A', isActive: true, lastSeenAt: '2026-09-27T10:00:00.000Z' };
const profile = { biometricProfileId: 'p1', studentId: 's1', studentName: 'Ada Student', matricNumber: 'CSC/2026/001', deviceId: 'd1', deviceName: device.deviceName, sensorSlotId: 12, enrolledAt: '2026-09-27T09:00:00.000Z' };

function mount(element) {
  return render(<MemoryRouter><AuthContext.Provider value={auth}>{element}</AuthContext.Provider></MemoryRouter>);
}

test('admin dashboard summarizes devices and fingerprint mappings', async () => {
  vi.spyOn(adminApi, 'devices').mockResolvedValue({ devices: [device] });
  vi.spyOn(adminApi, 'profiles').mockResolvedValue({ profiles: [profile] });
  mount(<AdminDashboard />);
  expect(await screen.findByRole('heading', { name: 'System administration' })).toBeTruthy();
  expect(screen.getByText('Engineering entrance')).toBeTruthy();
  expect(screen.getByText('Fingerprint profiles').parentElement.textContent).toContain('1');
});

test('an administrator registers a device and receives its one-time key', async () => {
  vi.spyOn(adminApi, 'devices').mockResolvedValue({ devices: [] });
  const create = vi.spyOn(adminApi, 'createDevice').mockResolvedValue({ device: { ...device, deviceId: 'd2' }, apiKey: 'a'.repeat(64) });
  mount(<AdminDevicesPage />);
  await screen.findByText('No attendance devices yet.');
  await userEvent.click(screen.getByRole('button', { name: 'Register device' }));
  await userEvent.type(screen.getByLabelText('Device name'), 'Engineering entrance');
  await userEvent.type(screen.getByLabelText('Location'), 'Block A');
  await userEvent.click(screen.getAllByRole('button', { name: 'Register device' }).at(-1));
  expect(await screen.findByRole('heading', { name: 'Save the key for Engineering entrance' })).toBeTruthy();
  expect(screen.getByText('a'.repeat(64))).toBeTruthy();
  expect(create).toHaveBeenCalledWith('admin-token', { deviceName: 'Engineering entrance', location: 'Block A' });
});

test('an administrator maps a student to an active device slot', async () => {
  vi.spyOn(adminApi, 'devices').mockResolvedValue({ devices: [device] });
  vi.spyOn(adminApi, 'profiles').mockResolvedValue({ profiles: [] });
  vi.spyOn(adminApi, 'students').mockResolvedValue({ students: [{ userId: 's1', fullName: 'Ada Student', matricNumber: 'CSC/2026/001', email: 'ada@example.test', profileCount: 0 }] });
  const enrol = vi.spyOn(adminApi, 'enrol').mockResolvedValue({ profile });
  mount(<AdminBiometricsPage />);
  await screen.findByText('No fingerprint mappings saved.');
  await userEvent.click(screen.getByRole('button', { name: 'New mapping' }));
  await screen.findByRole('option', { name: /Ada Student/ });
  await userEvent.selectOptions(screen.getByLabelText('Student'), 's1');
  await userEvent.selectOptions(screen.getByLabelText('Device'), 'd1');
  await userEvent.type(screen.getByLabelText('Sensor slot ID'), '12');
  await userEvent.click(screen.getByRole('button', { name: 'Save mapping' }));
  expect(enrol).toHaveBeenCalledWith('admin-token', { studentId: 's1', deviceId: 'd1', sensorSlotId: 12 });
});

test('device connection state distinguishes online, offline and disabled hardware', () => {
  const now = new Date('2026-09-27T10:01:00.000Z').getTime();
  expect(deviceConnection(device, now).label).toBe('Online');
  expect(deviceConnection({ ...device, lastSeenAt: '2026-09-27T09:50:00.000Z' }, now).label).toBe('Offline');
  expect(deviceConnection({ ...device, isActive: false }, now).label).toBe('Disabled');
});
