CREATE TABLE assignments (
  assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(course_id),
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  deadline TIMESTAMPTZ NOT NULL,
  difficulty_rating INTEGER NOT NULL CHECK (difficulty_rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);
CREATE INDEX assignments_course_index ON assignments(course_id);
CREATE INDEX assignments_deadline_index ON assignments(deadline) WHERE deleted_at IS NULL;
CREATE TABLE student_assignment_status (
  status_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(assignment_id),
  student_id UUID NOT NULL REFERENCES users(user_id),
  status VARCHAR(9) NOT NULL CHECK (status IN ('PENDING', 'COMPLETED')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (assignment_id, student_id),
  CHECK ((status = 'PENDING' AND completed_at IS NULL) OR (status = 'COMPLETED' AND completed_at IS NOT NULL))
);
CREATE INDEX student_assignment_status_student_index ON student_assignment_status(student_id);
