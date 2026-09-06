# Backend

Node.js, Express, and PostgreSQL API for Acadence. The application uses ES modules and keeps domain work inside modular-monolith feature folders.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` for a local PostgreSQL database.
3. Set a unique random `JWT_SECRET` of at least 32 characters.
4. Run `npm run db:migrate` to apply the users migration.
5. Start the development server with `npm run dev`.

The API listens on port `3000` by default. `GET /api/health` provides a process liveness check. Startup verifies the PostgreSQL connection before accepting requests.

## Commands

- `npm run dev` — run with automatic restart.
- `npm start` — run the API normally.
- `npm test` — run backend tests.
- `npm run lint` — check backend code quality.
- `npm run db:migrate` — apply unapplied SQL migrations transactionally.

Authentication endpoints are `POST /api/auth/register`, `POST /api/auth/login`, and
`GET /api/auth/me` (Authorization: Bearer token). Public prototype registration permits
students and lecturers; administrators cannot self-register.

PostgreSQL integration tests require `TEST_DATABASE_URL` pointing to a disposable migrated
database. Without it, `npm test` explicitly skips database integration tests. Tests remove
only their generated accounts. PostgreSQL 16 or newer is supported.

Course routes under `/api/courses` follow PROJECT_SPEC.md. The course owner manages
enrolment; students can read only their enrolled courses. DELETE archives a course while
preserving its related records. Apply all migrations before running integration tests.

Attendance and biometric endpoints added in later phases must follow the integrity rules in `AGENTS.md` and `PROJECT_SPEC.md`.
