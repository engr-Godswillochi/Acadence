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

Pages should compose feature modules as later phases are implemented. Shared components belong in `src/components`, while API configuration and future API clients belong in `src/services` and `src/config`.

Sign-in and registration are at `/login` and `/register`. `/account` requires authentication.
Tokens persist in sessionStorage for the current tab and are validated with the API on reload.
Sign-out clears the browser session; bearer tokens already issued expire on the server.
