import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { createBiometricService } from '../src/modules/biometrics/biometric.service.js';

function fixture(overrides = {}) {
  const device = {
    deviceId: randomUUID(),
    deviceName: 'Engineering lab',
    isActive: true,
    sensorReady: true,
    sensorCapacity: 162,
    reportedMode: 'IDLE',
    lastSeenAt: new Date().toISOString(),
  };
  const student = { userId: randomUUID(), fullName: 'Ada Student', matricNumber: 'CSC/001' };
  const admin = { userId: randomUUID(), role: 'ADMIN' };
  const state = { job: null, profile: null, claims: 0 };
  const dependencies = {
    transaction: (work) => work({}),
    devices: {
      find: async () => device,
    },
    profiles: {
      student: async () => student,
      existsForStudent: async () => false,
      nextAvailableSlot: async () => 7,
      create: async (_client, input) => {
        state.profile = { biometricProfileId: randomUUID(), ...input };
        return state.profile;
      },
      find: async () => state.profile,
    },
    attendance: { active: async () => null },
    jobs: {
      expire: async () => {},
      activeForDevice: async () => state.job,
      create: async (_client, input) => {
        state.job = {
          jobId: randomUUID(),
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 300000).toISOString(),
          studentName: student.fullName,
          matricNumber: student.matricNumber,
          ...input,
        };
        return state.job;
      },
      claim: async () => { state.job.status = 'CLAIMED'; state.claims += 1; return state.job; },
      find: async () => state.job,
      complete: async (_client, _id, profileId) => {
        state.job.status = 'COMPLETED';
        state.job.biometricProfileId = profileId;
        return state.job;
      },
    },
    ...overrides,
  };
  return { service: createBiometricService(dependencies), device, student, admin, state };
}

test('an enrollment job reserves the next sensor slot for an online idle device', async () => {
  const { service, device, student, admin } = fixture();
  const job = await service.createEnrollmentJob(admin, { deviceId: device.deviceId, studentId: student.userId });
  assert.equal(job.deviceId, device.deviceId);
  assert.equal(job.studentId, student.userId);
  assert.equal(job.sensorSlotId, 7);
  assert.equal(job.requestedBy, admin.userId);
  assert.equal(job.status, 'PENDING');
});

test('an offline device cannot receive fingerprint enrollment work', async () => {
  const offlineDevice = {
    deviceId: randomUUID(), isActive: true, sensorReady: true, sensorCapacity: 162,
    reportedMode: 'IDLE', lastSeenAt: new Date(Date.now() - 180000).toISOString(),
  };
  const { service, student, admin } = fixture({ devices: { find: async () => offlineDevice } });
  await assert.rejects(
    service.createEnrollmentJob(admin, { deviceId: offlineDevice.deviceId, studentId: student.userId }),
    (error) => error.statusCode === 409 && error.code === 'DEVICE_UNAVAILABLE',
  );
});

test('device work claims enrollment before attendance and completion creates the mapping once', async () => {
  const { service, device, student, admin, state } = fixture();
  const job = await service.createEnrollmentJob(admin, { deviceId: device.deviceId, studentId: student.userId });
  const work = await service.deviceWork(device);
  assert.equal(work.mode, 'ENROLLMENT');
  assert.equal(work.enrollment.jobId, job.jobId);
  assert.equal(state.claims, 1);

  const profile = await service.completeEnrollment(device, job.jobId);
  assert.equal(profile.deviceId, device.deviceId);
  assert.equal(profile.studentId, student.userId);
  assert.equal(profile.sensorSlotId, 7);
  assert.equal(state.job.status, 'COMPLETED');
  assert.deepEqual(await service.completeEnrollment(device, job.jobId), profile);
});

test('device work falls back to attendance and then idle', async () => {
  const session = { sessionId: randomUUID(), courseCode: 'COS 312' };
  const active = fixture({ attendance: { active: async () => session } });
  assert.deepEqual(await active.service.deviceWork(active.device), { mode: 'ATTENDANCE', session });

  const idle = fixture();
  assert.deepEqual(await idle.service.deviceWork(idle.device), { mode: 'IDLE' });
});
