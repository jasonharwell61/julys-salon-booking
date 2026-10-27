# Deployment Plan and Readiness Audit (Step 37)

Date: 2026-10-27. Repository: https://github.com/jasonharwell61/julys-salon-booking (branch `main`).

## 1. Platform-neutral plan

The app has three parts that deploy separately and talk over HTTPS:

1. **Database**: a hosted MongoDB cluster with a dedicated app user and restricted network access.
2. **Backend**: a Node.js host that runs `server/` (`npm install`, then `npm start`) and listens on the port the host provides.
3. **Frontend**: a static host that runs `npm run build` in `client/` and serves the `dist/` folder with a single-page-app fallback to `index.html`.

Order matters because each step needs a value from the one before it:

| Order | Step | Produces | Needed by |
|-------|------|----------|-----------|
| 1 | Database ready (Step 38) | Production connection string | Backend |
| 2 | Backend deployed (Step 39) | Public backend URL | Frontend build |
| 3 | Frontend deployed (Step 40) | Public frontend URL | Backend CORS setting |
| 4 | Backend `CLIENT_ORIGIN` set to the frontend URL and redeployed (Step 41) | Browser calls allowed | Smoke test |
| 5 | End-to-end smoke test from a private window (Step 42) | Evidence the core workflow works | Demo |

Rollback: both hosts keep earlier deployments, so a bad deploy can be reverted to the previous one from the dashboard. Secrets are only ever typed into the hosts' environment-variable screens, never committed.

## 2. Adapted to the selected platforms

| Part | Platform | Why |
|------|----------|-----|
| Database | MongoDB Atlas (already used in development) | Same service, a separate production database name |
| Backend | Render web service (free instance) | Connects to GitHub, supports a monorepo root directory, free tier available |
| Frontend | Vercel (Hobby) | Detects Vite, free, deep-link fix is one small file |

Known free-tier behavior to plan around (from Render's own documentation, checked 2026-10-27):

- A free web service **spins down after 15 minutes without traffic**, and waking it takes **about one minute**. Before any demo, open the health URL a few minutes ahead so the first visitor does not wait.
- Free instances get **750 instance hours per month**, which is enough for one always-awake service.
- No static outbound IP address is documented for free services, so MongoDB Atlas Network Access will need to allow all addresses (`0.0.0.0/0`). The tradeoff is explained in Step 38: the database is still protected by its username and password, TLS, and a least-privilege user, but it is reachable from any address.

## 3. Environment variables (names only; values go into the host dashboards)

**Backend (Render)**

| Name | Value / source | Secret? |
|------|----------------|---------|
| `NODE_ENV` | `production` | No |
| `MONGODB_URI` | Production connection string from Atlas | **Yes** |
| `JWT_SECRET` | A new random string of at least 32 characters, different from development | **Yes** |
| `JWT_EXPIRES_IN` | `1d` | No |
| `CLIENT_ORIGIN` | Exact frontend origin, for example `https://your-app.vercel.app` (no trailing slash, no path) | No |
| `AI_PROVIDER` | `gemini` | No |
| `AI_MODEL` | `gemini-3.5-flash-lite` | No |
| `AI_API_KEY` | Gemini API key | **Yes** |
| `AI_TIMEOUT_MS` | `15000` | No |
| `AI_RATE_LIMIT_MAX` | `20` | No |
| `TRUST_PROXY` | `1` (the host sits behind one proxy) | No |
| `PORT` | Provided by the host. Do not set it. | No |

**Frontend (Vercel)**

| Name | Value |
|------|-------|
| `VITE_API_BASE_URL` | `https://<backend-host>/api` (public, baked into the build; never put a secret here) |

Changing a `VITE_` variable requires a new frontend build.

## 4. Readiness checklist

| Item | Status | Evidence / action |
|------|--------|-------------------|
| Repository and branch | Pass | `origin` is the GitHub repo, branch `main`, working tree clean, all work pushed |
| Backend build/start commands | Pass | Build `npm install`; start `npm start` (runs `node src/server.js`) |
| Frontend build | Pass | `npm run build` succeeds (63 modules); output folder `dist` |
| Node version | Pass | Dependencies need Node 20.19 or newer (`mongoose` 9, `vite` 8). `server/package.json` now declares `"engines": {"node": ">=20.19.0"}`. Also pin the version in the Render dashboard in Step 39. |
| Environment variables | Pass (code) / To do (hosts) | All read through `server/src/config/env.js`; the list above is complete; `.env.example` files are current |
| `.gitignore` | Pass | `server/.gitignore` and `client/.gitignore` exclude `.env` and `node_modules`; `.env` was never committed (Step 34) |
| Health endpoint | Pass | `GET /api/health` returns 200 `ok` when the database is connected and 503 `degraded` otherwise |
| Backend binds to `process.env.PORT` | Pass | `env.port` reads `PORT` (default 5000 locally); `app.listen` binds all interfaces |
| CORS origins | To do in Step 41 | `CLIENT_ORIGIN` must be the exact deployed frontend origin. Default is localhost, which fails closed in production. |
| Proxy / rate limits | Pass (code) / To do (host) | `TRUST_PROXY=1` must be set on the host |
| Atlas Network Access | To do in Step 38 | Allow the backend host (`0.0.0.0/0` on free hosting; explained in Step 38) |
| Production database user | To do in Step 38 | Dedicated user with read/write on the production database only |
| SPA route rewrites | Pass | `client/vercel.json` rewrites every path to `/index.html`, so refresh and deep links work |
| AI provider key and model | Pass (local) / To do (host) | `npm run ai:check` passed locally. Add the key to Render only; confirm with a live AI request in Step 39 |
| Rate limits and cost controls | Pass | Free tier ($0). Per-user limit of 20 AI requests per 15 minutes; auth routes 20 per 15 minutes; messages capped at 300 characters; model output capped at 1024 tokens; 15 second timeout; no automatic retries |
| Automated tests | Pass | `npm test` in `server/` (booking rules, ownership, AI service, AI route, booking race); `npm run lint` and `npm run build` in `client/` |
| Security review | Pass | `docs/security-review.md`; `npm audit` shows 0 vulnerabilities |
| Seed data and admin account for production | To do in Steps 38 and 39 | Run `npm run seed` once against the production database (it skips services that already exist). Create the admin by registering normally, then changing that user's `role` in Atlas. |

**Decision:** all code-side items pass. The remaining items are host configuration, covered step by step in Steps 38 to 41. It is safe to proceed to Step 38.

## 5. Records to fill in during deployment

| Item | Value |
|------|-------|
| Repository URL | https://github.com/jasonharwell61/julys-salon-booking |
| Backend URL | _fill in at Step 39_ |
| Health URL | _backend URL + `/api/health`_ |
| Frontend URL | _fill in at Step 40_ |
