export function deviceConnection(device, now = Date.now()) {
  if (!device.isActive) return { label: 'Disabled', tone: 'muted' };
  if (!device.lastSeenAt) return { label: 'Never connected', tone: 'warning' };
  const age = now - new Date(device.lastSeenAt).getTime();
  if (Number.isFinite(age) && age <= 2 * 60 * 1000) return { label: 'Online', tone: 'success' };
  return { label: 'Offline', tone: 'warning' };
}

export function countOnlineDevices(devices, now = Date.now()) {
  return devices.filter((device) => deviceConnection(device, now).label === 'Online').length;
}
