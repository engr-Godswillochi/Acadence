# Frontend

React and Vite application for the student, lecturer, and device-administrator interfaces. The project uses ES modules and React Router.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` if the API is not available at the default local URL.
3. Start the development server with `npm run dev`.

## Commands

- `npm run dev` — start the Vite development server.
- `npm run build` — create a production build.
- `npm run lint` — check frontend code quality.
- `npm test` — run authentication form, routing, and session tests.
- `npm run preview` — preview the production build locally.

Pages compose feature modules. Shared components belong in `src/components`; shared HTTP
transport belongs in `src/services` and API configuration in `src/config`. Domain-specific
API calls belong in their respective `src/features` directories.

Sign-in and public registration are at `/login` and `/register`. The deliberately unlinked
administrator provisioning screen is at `/admin/register`. `/account` requires authentication.
Tokens persist in sessionStorage for the current tab and are validated with the API on reload.
Sign-out clears the browser session; bearer tokens already issued expire on the server.

`/courses` lists the current user's courses. Lecturers can create courses, edit or archive
them on `/courses/:id`, and manage enrolment using student account emails. Students see
only their enrolled courses. Administrator accounts have no course-management access.

## Vercel

Create a Vercel project whose root directory is `frontend` and set `VITE_API_BASE_URL` to the
deployed backend URL followed by `/api`. `vercel.json` includes the SPA fallback required for
direct visits to routes such as `/login`, `/admin/register`, and `/courses/:id`.

See [`../docs/deployment/vercel.md`](../docs/deployment/vercel.md) for the complete two-project
deployment procedure.
