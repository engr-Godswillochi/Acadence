DO $$
BEGIN
  CREATE TYPE user_role AS ENUM ('LECTURER', 'STUDENT', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  matric_number VARCHAR(50),
  staff_number VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_matric_number_unique UNIQUE (matric_number),
  CONSTRAINT users_staff_number_unique UNIQUE (staff_number),
  CONSTRAINT users_student_matric_number_required CHECK (
    role <> 'STUDENT' OR matric_number IS NOT NULL
  ),
  CONSTRAINT users_role_identifiers_check CHECK (
    (role = 'STUDENT' AND staff_number IS NULL)
    OR (role IN ('LECTURER', 'ADMIN') AND matric_number IS NULL)
  )
);

CREATE INDEX users_role_index ON users (role);
