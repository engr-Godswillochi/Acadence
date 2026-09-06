CREATE TABLE biometric_devices (
  device_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_name VARCHAR(160) NOT NULL,
  api_key_hash VARCHAR(64) NOT NULL UNIQUE,
  location VARCHAR(160),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE biometric_profiles (
  biometric_profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(user_id),
  device_id UUID NOT NULL REFERENCES biometric_devices(device_id),
  sensor_slot_id INTEGER NOT NULL CHECK(sensor_slot_id BETWEEN 1 AND 65535),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(device_id,sensor_slot_id), UNIQUE(device_id,student_id)
);
CREATE TABLE attendance_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(course_id),
  schedule_id UUID REFERENCES schedules(schedule_id) ON DELETE SET NULL,
  device_id UUID NOT NULL REFERENCES biometric_devices(device_id),
  opened_by UUID NOT NULL REFERENCES users(user_id),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMPTZ,
  status VARCHAR(6) NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','CLOSED')),
  CHECK ((status='ACTIVE' AND closed_at IS NULL) OR (status='CLOSED' AND closed_at >= opened_at))
);
CREATE UNIQUE INDEX attendance_active_course_idx ON attendance_sessions(course_id) WHERE status='ACTIVE';
CREATE UNIQUE INDEX attendance_active_device_idx ON attendance_sessions(device_id) WHERE status='ACTIVE';
CREATE INDEX attendance_course_idx ON attendance_sessions(course_id,opened_at DESC);
-- Freeze the eligible class roster so later enrolment changes cannot rewrite percentages.
CREATE TABLE attendance_session_students (
  session_id UUID NOT NULL REFERENCES attendance_sessions(session_id),
  student_id UUID NOT NULL REFERENCES users(user_id),
  PRIMARY KEY(session_id,student_id)
);
CREATE INDEX attendance_eligible_student_idx ON attendance_session_students(student_id);
CREATE TABLE attendance_records (
  record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES attendance_sessions(session_id),
  student_id UUID NOT NULL REFERENCES users(user_id),
  device_id UUID NOT NULL REFERENCES biometric_devices(device_id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verification_method VARCHAR(11) NOT NULL DEFAULT 'FINGERPRINT' CHECK(verification_method='FINGERPRINT'),
  UNIQUE(session_id,student_id),
  FOREIGN KEY(session_id,student_id) REFERENCES attendance_session_students(session_id,student_id)
);
CREATE INDEX attendance_records_student_idx ON attendance_records(student_id,recorded_at DESC);
