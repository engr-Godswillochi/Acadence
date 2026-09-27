# Deploy Acadence to Vercel

Acadence deploys as two Vercel projects from one GitHub repository. The frontend and backend
must not use the repository root as their Vercel root directory.

## 1. Prepare PostgreSQL

Create a hosted PostgreSQL database in a region close to the backend function. Use the
provider's pooled connection string when one is available; serverless deployments can create
several short-lived application instances.

From a trusted local terminal, run every migration against the production database before the
first backend deployment and whenever a new migration is added:

```bash
cd backend
DATABASE_URL='postgresql://...' DATABASE_SSL=true npm run db:migrate
```

Do not add migrations to Vercel's build command. Concurrent preview and production builds may
otherwise attempt the same schema change.

## 2. Create the backend project

Import this GitHub repository into Vercel and create a project with these settings:

| Setting | Value |
| --- | --- |
| Root Directory | `backend` |
| Framework Preset | Express |
| Install Command | default |
| Build Command | default |

Add these Production and Preview environment variables:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Hosted PostgreSQL pooled connection string |
| `DATABASE_SSL` | `true` when required by the provider |
| `DATABASE_POOL_MAX` | `3` |
| `FRONTEND_URLS` | Exact frontend origins, comma-separated |
| `JWT_SECRET` | Unique random value of at least 32 characters |
| `JWT_EXPIRES_IN` | `24h` |
| `ADMIN_REGISTRATION_SECRET` | A different unique random value of at least 32 characters |

Generate secrets locally, for example with `openssl rand -hex 32`. Keep the administrator
registration secret out of the frontend environment: it should be entered only by the person
authorized to provision administrators.

Deploy the backend and confirm that this returns a successful JSON response:

```text
https://YOUR-BACKEND.vercel.app/api/health
```

## 3. Create the frontend project

Import the same GitHub repository again as a second Vercel project:

| Setting | Value |
| --- | --- |
| Root Directory | `frontend` |
| Framework Preset | Vite |
| Install Command | default |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Set this variable for Production and Preview:

```text
VITE_API_BASE_URL=https://YOUR-BACKEND.vercel.app/api
```

Deploy the frontend. Then return to the backend project and set `FRONTEND_URLS` to the exact
production frontend origin, without a trailing slash. If a preview deployment must call the
shared backend, add that exact preview origin to the comma-separated list and redeploy the
backend.

## 4. Verify production

1. Open the frontend URL and create or sign in to a normal account.
2. Open `/admin/register` and verify that the server-only registration secret is required.
3. Refresh a nested page such as `/courses`; it should load instead of returning 404.
4. Create an announcement and confirm another account sees it within 15 seconds.
5. Point the ESP32 `API_BASE_URL` at `https://YOUR-BACKEND.vercel.app/api`, rebuild the firmware,
   and verify its heartbeat on the administrator device screen.

Notifications use database-backed polling in the deployed frontend. This avoids relying on an
in-memory live connection, which cannot broadcast reliably between separate serverless
instances.

## Deployment order after later changes

1. Apply any new database migrations.
2. Deploy the backend and check `/api/health`.
3. Deploy the frontend.
4. Run the relevant sign-in, enrolment, announcement, attendance, and device checks.
