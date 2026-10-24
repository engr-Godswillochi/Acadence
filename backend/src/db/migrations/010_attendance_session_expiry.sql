ALTER TABLE attendance_sessions
  ADD COLUMN expires_at TIMESTAMPTZ;

UPDATE attendance_sessions
SET expires_at = opened_at + INTERVAL '30 minutes';

-- Release courses and devices held by sessions left open before expiry existed.
UPDATE attendance_sessions
SET status = 'CLOSED', closed_at = expires_at
WHERE status = 'ACTIVE' AND expires_at <= CURRENT_TIMESTAMP;

ALTER TABLE attendance_sessions
  ALTER COLUMN expires_at SET NOT NULL;

CREATE INDEX attendance_expiry_idx
  ON attendance_sessions(expires_at)
  WHERE status = 'ACTIVE';
