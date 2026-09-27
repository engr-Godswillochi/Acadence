import { randomBytes } from 'node:crypto';
import { ApiError } from '../../utils/apiError.js';
import { withTransaction } from '../../db/transaction.js';
import { attendanceRepository } from '../attendance/attendance.repository.js';
import { deviceRepository } from '../devices/device.repository.js';
import { hashDeviceKey } from '../devices/device.auth.js';
import { biometricRepository } from './biometric.repository.js';
import { enrollmentJobRepository } from './enrollment-job.repository.js';

const onlineWindowMs = 2 * 60 * 1000;

function deviceCanAcceptWork(device) {
  return device?.isActive
    && device.sensorReady === true
    && device.lastSeenAt
    && Date.now() - new Date(device.lastSeenAt).getTime() < onlineWindowMs;
}

function jobConflict(error) {
  if (error.code === '23505') {
    return new ApiError(409, 'DEVICE_BUSY', 'This device already has enrollment or attendance work assigned.');
  }
  return error;
}

export function createBiometricService({
  devices = deviceRepository,
  profiles = biometricRepository,
  jobs = enrollmentJobRepository,
  attendance = attendanceRepository,
  transaction = withTransaction,
} = {}) {
  return {
    async createDevice(data) {
      const apiKey = randomBytes(32).toString('hex');
      return { device: await devices.create({ ...data, apiKeyHash: hashDeviceKey(apiKey) }), apiKey };
    },

    listDevices: () => devices.list(),

    async updateDevice(id, data) {
      return transaction(async (client) => {
        const current = await devices.find(id, client);
        if (!current) throw new ApiError(404, 'DEVICE_NOT_FOUND', 'Device not found.');
        return devices.update(id, {
          deviceName: data.deviceName ?? current.deviceName,
          location: data.location === undefined ? current.location : data.location,
          isActive: data.isActive ?? current.isActive,
        }, client);
      });
    },

    async rotateDeviceKey(id) {
      const apiKey = randomBytes(32).toString('hex');
      const device = await transaction(async (client) => {
        if (!await devices.find(id, client)) throw new ApiError(404, 'DEVICE_NOT_FOUND', 'Device not found.');
        return devices.rotateKey(id, hashDeviceKey(apiKey), client);
      });
      return { device, apiKey };
    },

    // Kept temporarily for the existing admin screen. New enrollment work must use
    // createEnrollmentJob so a mapping cannot precede physical sensor enrollment.
    async enrol(data) {
      try {
        return await transaction(async (client) => {
          if (!await profiles.student(data.studentId, client)) throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student not found.');
          if (!(await devices.find(data.deviceId, client))?.isActive) throw new ApiError(400, 'DEVICE_UNAVAILABLE', 'Choose an authorized device.');
          return profiles.create(client, data);
        });
      } catch (error) {
        if (error.code === '23505') throw new ApiError(409, 'BIOMETRIC_MAPPING_EXISTS', 'That device slot or student mapping already exists.');
        throw error;
      }
    },

    listProfiles: () => profiles.list(),
    students: (query) => profiles.students(query),

    async remove(id) {
      const removed = await transaction((client) => profiles.remove(client, id));
      if (!removed) throw new ApiError(404, 'BIOMETRIC_PROFILE_NOT_FOUND', 'Biometric profile not found.');
    },

    async createEnrollmentJob(admin, data) {
      try {
        return await transaction(async (client) => {
          await jobs.expire(client, data.deviceId);
          const device = await devices.find(data.deviceId, client, 'update');
          if (!device) throw new ApiError(404, 'DEVICE_NOT_FOUND', 'Device not found.');
          if (!deviceCanAcceptWork(device) || device.reportedMode !== 'IDLE') {
            throw new ApiError(409, 'DEVICE_UNAVAILABLE', 'Choose an online, idle device with a ready fingerprint sensor.');
          }
          const student = await profiles.student(data.studentId, client);
          if (!student) throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student not found.');
          if (await profiles.existsForStudent(device.deviceId, student.userId, client)) {
            throw new ApiError(409, 'BIOMETRIC_MAPPING_EXISTS', 'This student already has a fingerprint on that device.');
          }
          if (await attendance.active(device.deviceId, client)) {
            throw new ApiError(409, 'DEVICE_BUSY', 'This device is recording an attendance session.');
          }
          if (await jobs.activeForDevice(client, device.deviceId)) {
            throw new ApiError(409, 'DEVICE_BUSY', 'This device already has an enrollment job.');
          }
          const sensorSlotId = await profiles.nextAvailableSlot(device.deviceId, device.sensorCapacity, client);
          if (!sensorSlotId) throw new ApiError(409, 'SENSOR_FULL', 'The fingerprint sensor has no available template slots.');
          return jobs.create(client, {
            studentId: student.userId,
            deviceId: device.deviceId,
            sensorSlotId,
            requestedBy: admin.userId,
          });
        });
      } catch (error) {
        throw jobConflict(error);
      }
    },

    async getEnrollmentJob(id) {
      const job = await jobs.find(id);
      if (!job) throw new ApiError(404, 'ENROLLMENT_JOB_NOT_FOUND', 'Fingerprint enrollment job not found.');
      return job;
    },

    async cancelEnrollmentJob(id) {
      return transaction(async (client) => {
        const job = await jobs.find(id, client, true);
        if (!job) throw new ApiError(404, 'ENROLLMENT_JOB_NOT_FOUND', 'Fingerprint enrollment job not found.');
        if (!['PENDING', 'CLAIMED'].includes(job.status)) {
          throw new ApiError(409, 'ENROLLMENT_JOB_FINISHED', 'This fingerprint enrollment job has already finished.');
        }
        return jobs.cancel(client, id);
      });
    },

    async deviceWork(device) {
      return transaction(async (client) => {
        await jobs.expire(client, device.deviceId);
        const enrollment = await jobs.activeForDevice(client, device.deviceId, true);
        if (enrollment) {
          await jobs.claim(client, enrollment.jobId);
          return {
            mode: 'ENROLLMENT',
            enrollment: {
              jobId: enrollment.jobId,
              sensorSlotId: enrollment.sensorSlotId,
              studentName: enrollment.studentName,
              matricNumber: enrollment.matricNumber,
              expiresAt: enrollment.expiresAt,
            },
          };
        }
        const session = await attendance.active(device.deviceId, client);
        if (session) return { mode: 'ATTENDANCE', session };
        return { mode: 'IDLE' };
      });
    },

    async completeEnrollment(device, id) {
      try {
        return await transaction(async (client) => {
          await jobs.expire(client, device.deviceId);
          const job = await jobs.find(id, client, true);
          if (!job || job.deviceId !== device.deviceId) {
            throw new ApiError(404, 'ENROLLMENT_JOB_NOT_FOUND', 'Fingerprint enrollment job not found.');
          }
          if (job.status === 'COMPLETED') return profiles.find(job.biometricProfileId, client);
          if (job.status !== 'CLAIMED') {
            throw new ApiError(409, 'ENROLLMENT_JOB_INACTIVE', 'This fingerprint enrollment job is no longer active.');
          }
          const profile = await profiles.create(client, job);
          await jobs.complete(client, id, profile.biometricProfileId);
          return profile;
        });
      } catch (error) {
        if (error.code === '23505') throw new ApiError(409, 'BIOMETRIC_MAPPING_EXISTS', 'That student or sensor slot is already mapped.');
        throw error;
      }
    },

    async failEnrollment(device, id, failureCode) {
      return transaction(async (client) => {
        const job = await jobs.find(id, client, true);
        if (!job || job.deviceId !== device.deviceId) {
          throw new ApiError(404, 'ENROLLMENT_JOB_NOT_FOUND', 'Fingerprint enrollment job not found.');
        }
        if (!['PENDING', 'CLAIMED'].includes(job.status)) return job;
        return jobs.fail(client, id, failureCode);
      });
    },
  };
}

export const biometricService = createBiometricService();
