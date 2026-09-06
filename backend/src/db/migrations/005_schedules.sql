CREATE TABLE schedules (
  schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(course_id),
  day_of_week VARCHAR(9) NOT NULL CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  venue VARCHAR(160) NOT NULL CHECK (length(trim(venue)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (start_time < end_time)
);
CREATE INDEX schedules_course_idx ON schedules(course_id);
