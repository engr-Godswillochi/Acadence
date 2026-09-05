# Backend

Node.js + Express + PostgreSQL API.

Use a modular-monolith architecture organized by domain modules.

Each domain should separate HTTP handling, business logic, validation, and database access as described in the root `AGENTS.md`.

Attendance and biometric endpoints are security-sensitive and must follow the integrity rules in `AGENTS.md` and `PROJECT_SPEC.md`.
