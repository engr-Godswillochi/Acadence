CREATE TABLE courses (
  course_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code VARCHAR(30) NOT NULL,
  course_title VARCHAR(160) NOT NULL,
  credit_units INTEGER NOT NULL CHECK (credit_units BETWEEN 1 AND 6),
  lecturer_id UUID NOT NULL REFERENCES users(user_id),
  academic_session VARCHAR(9) NOT NULL,
  semester VARCHAR(6) NOT NULL CHECK (semester IN ('FIRST', 'SECOND')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMPTZ,
  UNIQUE (course_code, academic_session, semester)
);
CREATE INDEX courses_lecturer_index ON courses(lecturer_id);

CREATE TABLE enrolments (
  enrolment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(course_id),
  student_id UUID NOT NULL REFERENCES users(user_id),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (course_id, student_id)
);
CREATE INDEX enrolments_student_index ON enrolments(student_id);
