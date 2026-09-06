# AGENTS.md

## Purpose

This file defines the working rules for Codex and any other coding agent contributing to this repository.

The repository is a final-year Computer Science project:

**Design and Implementation of an Academic Collaboration, Productivity, and Biometric Attendance Management System**

`PROJECT_SPEC.md` is the primary product and system specification. Read it before making architectural or feature decisions.

The project deliberately excludes Artificial Intelligence and Machine Learning from the implemented system.

---

## 1. Source of Truth

Before implementing a feature:

1. Read the relevant section of `PROJECT_SPEC.md`.
2. Inspect the existing implementation before creating new abstractions.
3. Prefer the current repository conventions when they are consistent with this file.
4. Do not reintroduce features that were removed from the project scope.
5. When implementation and documentation disagree, do not silently choose one. Resolve the conflict by updating the appropriate documentation as part of the same change.

Priority order:

```text
1. Explicit user instruction
2. PROJECT_SPEC.md
3. AGENTS.md
4. Existing code conventions
5. Reasonable engineering defaults
```

---

## 2. Repository Structure

Keep frontend and backend completely separated.

```text
/
├── AGENTS.md
├── PROJECT_SPEC.md
├── README.md
├── .gitignore
│
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── diagrams/
│   └── testing/
│
├── frontend/
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── common/
│       │   ├── layout/
│       │   └── ui/
│       ├── features/
│       │   ├── auth/
│       │   ├── courses/
│       │   ├── assignments/
│       │   ├── announcements/
│       │   ├── schedules/
│       │   ├── attendance/
│       │   ├── notifications/
│       │   └── biometrics/
│       ├── pages/
│       │   ├── student/
│       │   ├── lecturer/
│       │   └── admin/
│       ├── context/
│       ├── hooks/
│       ├── services/
│       ├── styles/
│       ├── utils/
│       └── App.jsx
│
└── backend/
    ├── package.json
    ├── tests/
    └── src/
        ├── app.js
        ├── server.js
        ├── config/
        ├── middleware/
        ├── services/
        ├── utils/
        ├── db/
        │   ├── migrations/
        │   └── seeds/
        └── modules/
            ├── auth/
            ├── users/
            ├── courses/
            ├── enrolments/
            ├── assignments/
            ├── announcements/
            ├── schedules/
            ├── attendance/
            ├── biometrics/
            ├── devices/
            ├── notifications/
            └── analytics/
```

### Backend module convention

Use a modular-monolith architecture.

Each domain module should own its route, controller, service, validation, and data-access code where applicable.

Example:

```text
backend/src/modules/assignments/
├── assignment.routes.js
├── assignment.controller.js
├── assignment.service.js
├── assignment.repository.js
├── assignment.validation.js
└── assignment.constants.js
```

Responsibilities:

- **routes**: HTTP route registration and middleware composition.
- **controller**: translate HTTP request/response to service calls.
- **service**: business rules and use-case orchestration.
- **repository**: database queries only.
- **validation**: input schemas and request validation.
- **constants**: stable domain constants when needed.

Do not put SQL queries directly in controllers.

Do not put business logic directly in routes.

Do not create microservices for this project unless explicitly required. A modular monolith is preferred because it is easier to develop, test, deploy, demonstrate, and defend academically.

### Frontend feature convention

Use feature-based organization rather than placing all logic into large global folders.

A feature may contain:

```text
frontend/src/features/attendance/
├── components/
├── hooks/
├── attendance.api.js
├── attendance.utils.js
└── index.js
```

Pages compose features. Shared reusable primitives belong in `components/ui` or `components/common`.

Do not duplicate API calls across pages.

---

## 3. Architectural Principles

Use the simplest architecture that remains clean under growth.

Prefer:

- modular monolith over microservices;
- REST APIs;
- PostgreSQL as the single application database;
- Server-Sent Events for one-way real-time browser notifications;
- clear module boundaries;
- reusable services;
- database migrations;
- explicit validation;
- dependency direction from controller → service → repository;
- small focused React components;
- feature-based frontend organization.

Avoid:

- unnecessary abstraction layers;
- premature generic frameworks;
- circular dependencies;
- giant controllers;
- giant React page components;
- duplicated business rules between frontend and backend;
- hidden side effects;
- speculative architecture for features that are not in scope.

The backend is the authority for business rules and security-sensitive decisions.

The frontend may reproduce presentation-only calculations when harmless, but it must not be trusted for authorization, attendance integrity, ownership checks, or official statistics.

---

## 4. AI/ML Scope Rule

Do **not** add AI, Machine Learning, prediction models, generative features, chatbots, NLP, recommendation models, synthetic training pipelines, model retraining, or "AI-powered" functionality.

Do not add UI copy such as:

- "AI powered"
- "smart prediction"
- "intelligent recommendation"
- "risk prediction"
- "generated for you"

The implemented project should look and behave like a polished academic productivity and biometric attendance platform, not an AI product.

Deterministic algorithms are allowed.

Examples:

- deadline-based task priority;
- attendance percentage;
- overdue detection;
- sorting;
- filtering;
- configurable threshold warnings;
- descriptive analytics.

These must be described accurately as rules, calculations, or analytics, not AI.

---

## 5. UI/UX Direction

The UI should feel:

- minimal;
- premium;
- calm;
- modern;
- academic;
- professional;
- intentional;
- easy to demonstrate during a final-year project defense.

Avoid the stereotypical "AI-generated dashboard" look.

### Do not overuse

- purple/blue neon gradients;
- glowing borders;
- excessive glassmorphism;
- huge rounded cards everywhere;
- random gradient text;
- decorative blobs;
- excessive shadows;
- emojis as functional icons;
- too many dashboard cards;
- animations without purpose;
- giant hero sections inside authenticated application pages;
- generic "AI SaaS" visual patterns.

### Prefer

- restrained neutral surfaces;
- one clear accent color;
- strong typography hierarchy;
- generous but controlled spacing;
- consistent border radius;
- subtle borders;
- very light elevation when needed;
- clear table/list layouts;
- purposeful data visualization;
- polished empty states;
- responsive layouts;
- accessible contrast;
- consistent icon library;
- clear loading and error states.

### Interaction quality

Animations should be subtle and fast.

Use motion only to:

- indicate state change;
- improve orientation;
- make overlays/dialogs feel smooth;
- confirm successful actions.

Do not use animation as decoration.

### Responsive behavior

Every main screen should work at minimum on:

- common laptop widths used during a project defense;
- tablets;
- modern mobile screens.

Desktop is the primary productivity experience, but student-facing views should remain practical on mobile.

---

## 6. Component Design Rules

Create reusable components only when reuse is real or strongly expected.

Prefer composition over configuration-heavy mega-components.

Examples of valid shared components:

- `Button`
- `Input`
- `Select`
- `Modal`
- `ConfirmDialog`
- `EmptyState`
- `PageHeader`
- `StatusBadge`
- `DataTable`
- `LoadingState`
- `ErrorState`

Do not create a shared component just because two pieces of markup look vaguely similar.

A component should have a clear responsibility.

If a component becomes difficult to understand, split it by behavior or responsibility, not by arbitrary line count.

---

## 7. Commenting Rules

Comments must be useful.

### Comment the "why", not the obvious "what"

Bad:

```js
// Increment count
count++;
```

Good:

```js
// Closed sessions only are included so an active class does not
// temporarily lower every student's official attendance percentage.
```

### Add comments when

- a business rule is non-obvious;
- hardware behavior requires explanation;
- a workaround exists because of a library/device limitation;
- security logic is subtle;
- a decision would otherwise look accidental;
- a formula needs domain context.

### Avoid

- comments that repeat the code;
- comments on every function;
- obvious section-divider comments;
- dead commented-out code;
- long essays inside source files;
- stale TODO comments.

Use clear naming so code explains itself whenever possible.

### TODO rule

A TODO must explain what remains and why.

Bad:

```js
// TODO fix this
```

Better:

```js
// TODO: add offline device retry queue after the online attendance MVP is stable.
```

Remove completed TODOs.

---

## 8. AGENTS.md Self-Update Rule

Codex is allowed and expected to update this file when it discovers durable repository knowledge that will help future work.

Update `AGENTS.md` when you learn something such as:

- a repository-wide convention;
- a non-obvious architectural decision;
- a hardware constraint;
- a recurring setup requirement;
- an important domain rule;
- a test command future agents need;
- a known incompatibility or required workaround;
- a user preference that should consistently affect future implementation.

Do **not** update this file with:

- temporary debugging state;
- one-off task notes;
- current progress;
- speculative ideas;
- secrets;
- credentials;
- local machine-specific paths unless they are genuinely required project setup.

Add durable discoveries under:

```text
## Learned Repository Conventions
```

Keep additions concise.

If a new discovery contradicts an older instruction, replace or clarify the outdated instruction instead of appending contradictory rules.

When changing this file, mention the change in the task summary.

---

## 9. Project Specification Update Rule

`PROJECT_SPEC.md` describes the intended system.

Update it when implementation introduces a deliberate, durable change to:

- architecture;
- database schema;
- API contracts;
- system behavior;
- role permissions;
- hardware workflow;
- supported features.

Do not update the spec merely because the current code is incomplete.

The spec should describe the intended accepted design, not temporary implementation status.

---

## 10. Database Rules

Use PostgreSQL.

Requirements:

- use migrations;
- use foreign keys;
- use unique constraints for integrity;
- use indexes where query patterns justify them;
- use parameterized queries or a safe database library;
- never concatenate untrusted input into SQL;
- perform multi-write business operations in transactions when partial completion would corrupt state.

Important integrity examples:

```text
UNIQUE(course_id, student_id)
UNIQUE(assignment_id, student_id)
UNIQUE(session_id, student_id)
UNIQUE(device_id, sensor_slot_id)
```

Do not store raw fingerprint images in PostgreSQL.

The database stores the relationship between a student, a biometric device, and the AS608 sensor slot ID.

---

## 11. Attendance Integrity Rules

Attendance is security-sensitive.

For every attendance submission:

1. authenticate the biometric device;
2. confirm the device is active;
3. confirm the attendance session exists;
4. confirm the session is ACTIVE;
5. map `(device_id, sensor_slot_id)` to a student;
6. confirm the biometric profile is active;
7. confirm the student is enrolled in the course;
8. reject duplicate attendance;
9. record server time as the authoritative attendance timestamp;
10. return a clear device-safe response.

Do not trust a student UUID supplied directly by the ESP32 if identity can instead be resolved from the registered sensor slot mapping.

Do not allow the frontend to create official attendance records.

---

## 12. Authentication and Authorization Rules

Use:

- bcrypt password hashing;
- JWT authentication;
- role-based middleware;
- resource ownership checks.

Never rely only on hiding frontend buttons.

Examples:

- a student cannot access lecturer endpoints;
- a lecturer cannot edit another lecturer's course;
- a student cannot read another student's private attendance history;
- an admin/device API key cannot be treated as a user JWT.

Do not log passwords, raw JWTs, API keys, or secrets.

---

## 13. API Rules

Use consistent response shapes.

Success example:

```json
{
  "success": true,
  "data": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "ATTENDANCE_ALREADY_RECORDED",
    "message": "Attendance has already been recorded for this session."
  }
}
```

Controllers should not leak stack traces or raw database errors.

Use appropriate HTTP status codes.

Validate incoming request data at API boundaries.

Keep endpoint naming RESTful and consistent with `PROJECT_SPEC.md`.

---

## 14. Real-Time Notifications

Use Server-Sent Events for server-to-browser notification streaming unless a future requirement genuinely requires two-way real-time communication.

Persist notifications in the database first, then push them to connected clients.

A temporary SSE disconnect must not cause notification loss.

---

## 15. Hardware Integration Rules

Hardware code and backend code must agree on a small, explicit protocol.

Keep hardware responses concise and deterministic.

The ESP32 should be able to distinguish at least:

- success;
- no active session;
- unknown fingerprint mapping;
- duplicate attendance;
- unauthorized device;
- network/server failure.

Do not expose backend implementation details on the OLED.

Prefer user-readable messages such as:

```text
Attendance Recorded
Already Recorded
Not Enrolled
No Active Session
Try Again
Network Error
```

---

## 16. Error Handling

Handle errors deliberately.

Frontend:

- show useful user-facing messages;
- preserve form input when possible;
- show retry actions where appropriate;
- distinguish empty state from error state;
- avoid blank screens.

Backend:

- use centralized error handling;
- map known domain errors to stable error codes;
- log enough context to debug without logging secrets;
- fail safely.

Hardware:

- display short actionable errors;
- recover from temporary Wi-Fi failure;
- do not create duplicate records during retries.

---

## 17. Testing Expectations

Every meaningful backend business rule should be testable without the UI.

Prioritize tests for:

- authentication;
- authorization;
- course ownership;
- enrolment uniqueness;
- assignment status;
- priority calculation;
- attendance session state;
- biometric slot mapping;
- duplicate attendance prevention;
- attendance percentage;
- notification persistence.

When fixing a bug, add or update a regression test when practical.

Before declaring a task complete:

1. run the relevant tests;
2. run linting if configured;
3. verify the affected user flow;
4. check for obvious console/server errors;
5. confirm documentation remains accurate.

Do not claim tests passed unless they were actually run.

---

## 18. Code Quality Rules

Prefer:

- descriptive names;
- small cohesive functions;
- early returns;
- explicit error handling;
- single-purpose modules;
- consistent formatting.

Avoid:

- deeply nested logic;
- magic numbers;
- duplicated constants;
- unused abstractions;
- giant utility files;
- generic names such as `helper.js` when a domain-specific name is possible.

Refactor when necessary, but do not perform unrelated large rewrites during a focused feature task.

---

## 19. Dependency Rules

Before adding a dependency, ask:

1. Is it needed?
2. Is the same capability already available?
3. Is the package maintained?
4. Does it substantially simplify the implementation?
5. Is it appropriate for a final-year project that must be explained and defended?

Prefer a smaller dependency surface.

Do not add libraries solely to implement a trivial function.

---

## 20. Git and Change Discipline

Keep changes focused.

A task should not silently include unrelated rewrites.

When completing work, summarize:

- what changed;
- important design decisions;
- files affected;
- tests run;
- remaining limitations;
- whether `PROJECT_SPEC.md` or `AGENTS.md` changed.

Never commit:

- `.env`;
- credentials;
- API keys;
- database dumps containing real personal data;
- build artifacts that do not belong in source control;
- `node_modules`.

---

## 21. Academic Project Standard

This repository is not a commercial SaaS product trying to maximize feature count.

Prioritize features that:

- clearly solve the stated project problem;
- can be demonstrated reliably;
- can be explained during defense;
- have clear implementation evidence;
- connect directly to project objectives.

Avoid feature creep.

A smaller complete system with strong hardware/software integration is better than a large collection of half-finished features.

---

## 22. Definition of Done for a Feature

A feature is complete when:

- the intended user flow works;
- backend validation exists;
- authorization is correct;
- database integrity is preserved;
- loading/error/empty UI states are handled;
- the UI matches the repository's visual direction;
- relevant tests pass;
- no obvious debug code remains;
- documentation is updated when necessary.

---

## 23. Learned Repository Conventions

Add future durable discoveries here.

- The project intentionally contains no AI/ML implementation.
- Frontend and backend remain separate top-level applications.
- Backend architecture is a modular monolith organized by domain.
- UI should be restrained, minimal, premium, and suitable for an academic project defense.
- Frontend and backend are separate npm-managed ES module applications requiring Node.js 20.19 or newer.
- The frontend uses Vite and React Router; the backend verifies its PostgreSQL connection before listening for requests.
- After completing and validating an implementation phase, proceed directly to the next phase. Do not advance past a phase with unresolved validation failures or required integration checks.
- Commit coherent, validated changes locally as work progresses. Do not push commits unless explicitly instructed.
- SQL migrations under backend/src/db/migrations are source files and must remain tracked despite the general SQL dump ignore rule.
