ALTER TABLE biometric_devices
  ADD COLUMN reported_mode VARCHAR(10) NOT NULL DEFAULT 'OFFLINE'
    CHECK (reported_mode IN ('OFFLINE', 'IDLE', 'ENROLLMENT', 'ATTENDANCE', 'ERROR')),
  ADD COLUMN firmware_version VARCHAR(64),
  ADD COLUMN sensor_ready BOOLEAN,
  ADD COLUMN sensor_capacity INTEGER NOT NULL DEFAULT 162
    CHECK (sensor_capacity BETWEEN 1 AND 65535),
  ADD COLUMN status_updated_at TIMESTAMPTZ;

CREATE TABLE biometric_enrollment_jobs (
  job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(user_id),
  device_id UUID NOT NULL REFERENCES biometric_devices(device_id),
  sensor_slot_id INTEGER NOT NULL CHECK (sensor_slot_id BETWEEN 1 AND 65535),
  requested_by UUID NOT NULL REFERENCES users(user_id),
  biometric_profile_id UUID REFERENCES biometric_profiles(biometric_profile_id),
  status VARCHAR(10) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'CLAIMED', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED')),
  failure_code VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  claimed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '5 minutes')
);

CREATE UNIQUE INDEX biometric_enrollment_open_device_idx
  ON biometric_enrollment_jobs(device_id)
  WHERE status IN ('PENDING', 'CLAIMED');

CREATE UNIQUE INDEX biometric_enrollment_open_student_device_idx
  ON biometric_enrollment_jobs(student_id, device_id)
  WHERE status IN ('PENDING', 'CLAIMED');

CREATE INDEX biometric_enrollment_device_history_idx
  ON biometric_enrollment_jobs(device_id, created_at DESC);

ALTER TABLE attendance_records ADD COLUMN device_event_id VARCHAR(64);
CREATE UNIQUE INDEX attendance_device_event_idx
  ON attendance_records(device_id, device_event_id)
  WHERE device_event_id IS NOT NULL;
