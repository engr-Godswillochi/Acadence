# Backend

Node.js, Express, and PostgreSQL API for Acadence. The application uses ES modules and keeps domain work inside modular-monolith feature folders.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` for a local PostgreSQL database.
3. Set unique random `JWT_SECRET` and `ADMIN_REGISTRATION_SECRET` values of at least 32 characters.
4. Run `npm run db:migrate` to apply the users migration.
5. Start the development server with `npm run dev`.

The API listens on port `3000` by default. `GET /api/health` provides a process liveness check. Startup verifies the PostgreSQL connection before accepting requests.

## Commands

- `npm run dev` — run with automatic restart.
- `npm start` — run the API normally.
- `npm test` — run backend tests.
- `npm run lint` — check backend code quality.
- `npm run db:migrate` — apply unapplied SQL migrations transactionally.

Authentication endpoints are `POST /api/auth/register`, `POST /api/auth/admin/register`, `POST /api/auth/login`, and
`GET /api/auth/me` (Authorization: Bearer token). Public prototype registration permits
students and lecturers. Administrator registration requires the server-configured secret code
and is limited to five attempts per IP every 15 minutes.

PostgreSQL integration tests require `TEST_DATABASE_URL` pointing to a disposable migrated
database. Without it, `npm test` explicitly skips database integration tests. Tests remove
only their generated accounts. PostgreSQL 16 or newer is supported.

Course routes under `/api/courses` follow PROJECT_SPEC.md. The course owner manages
enrolment; students can read only their enrolled courses. DELETE archives a course while
preserving its related records. Apply all migrations before running integration tests.

Attendance and biometric endpoints added in later phases must follow the integrity rules in `AGENTS.md` and `PROJECT_SPEC.md`.

Fingerprint enrollment is device-confirmed. An administrator creates an expiring job with
`POST /api/admin/biometric-enrolments`; the authenticated ESP32 claims it through
`GET /api/device/work` and confirms or fails the physical AS608 enrollment. PostgreSQL
creates the student/device/slot profile only after successful device confirmation.

## Vercel

Create a Vercel project whose root directory is `backend`. The root `index.js` exports the
Express application without opening a listening port, while local development continues to
use `src/server.js`. Configure all variables from `.env.example`, use a pooled hosted
PostgreSQL connection, and run `npm run db:migrate` against that database before deploying.

The API accepts browser requests only from the exact comma-separated origins in
`FRONTEND_URLS`. See [`../docs/deployment/vercel.md`](../docs/deployment/vercel.md) for the
production values and rollout order.
