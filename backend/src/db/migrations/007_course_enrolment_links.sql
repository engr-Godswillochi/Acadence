-- Shareable enrolment links: a lecturer issues a token-backed URL that a signed-in
-- student redeems to join the course, instead of the lecturer typing their email.
CREATE TABLE course_enrolment_links (
  link_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(course_id),
  token VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMPTZ
);
CREATE INDEX course_enrolment_links_course_idx ON course_enrolment_links(course_id);
-- At most one live link per course. Issuing a new link revokes the previous one in
-- the same transaction, so a stale link can never outlive its replacement.
CREATE UNIQUE INDEX course_enrolment_links_live_idx ON course_enrolment_links(course_id) WHERE revoked_at IS NULL;
