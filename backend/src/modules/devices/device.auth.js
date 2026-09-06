import { createHash } from 'node:crypto';
import { ApiError } from '../../utils/apiError.js';
import { deviceRepository } from './device.repository.js';

export const hashDeviceKey = (key) => createHash('sha256').update(key).digest('hex');
export async function authenticateDevice(req, res, next) {
  const key = req.get('X-Device-Key');
  if (!key || !/^[a-f0-9]{64}$/.test(key)) throw new ApiError(401, 'DEVICE_UNAUTHORIZED', 'Unauthorized device.');
  const device = await deviceRepository.byHash(hashDeviceKey(key));
  if (!device?.isActive) throw new ApiError(401, 'DEVICE_UNAUTHORIZED', 'Unauthorized device.');
  req.device = device;
  next();
}
