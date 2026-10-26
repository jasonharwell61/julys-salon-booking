# Security Review (Step 34)

Date: 2026-10-25. Scope: the whole repository (server, client, scripts, configuration, Git history, dependencies).
Method: code reading of every route, controller, validator, middleware and model; automated checks (Git history search for secrets, `npm audit`, search for unsafe React patterns); and tests that reproduce each fixed issue.

## Findings, most severe first

| # | Severity | Finding | Where | Status |
|---|----------|---------|-------|--------|
| 1 | High | `body-parser` (dependency of Express) has a known denial-of-service advisory (GHSA-27r3-jxmh-p828). | `server/package-lock.json` | **Open**: fix with `npm audit fix` in `server/`, then retest |
| 2 | Medium | Rate limiting would treat every visitor as one address behind a hosting proxy, so 20 login attempts from anyone would lock out everyone, and the AI and auth limits would be wrong. | `server/src/app.js`, `server/src/config/env.js` | **Fixed in code**; production must set `TRUST_PROXY=1` (Step 41) |
| 3 | Medium | Login token is stored in `localStorage`, so a script injected by XSS could read it. Logout only deletes the browser copy; the token stays valid until it expires (1 day). | `client/src/api/tokenStorage.js` | **Accepted and documented**; mitigated (see below) |
| 4 | Low | Frontend host will not send a Content-Security-Policy header by default. | Deployment (Step 40) | Open: add headers when deploying the client |
| 5 | Low | Rate limit counters live in server memory: they reset when the server restarts and are not shared between instances. | `server/src/middleware/rateLimiters.js` | Accepted (single instance) |
| 6 | Low | Login limit is per address, with no per-account lockout. | `authRoutes.js` | Accepted (20 attempts / 15 min, bcrypt, generic error) |
| 7 | Low | `/api/health` is public and reveals database up/down state. | `healthController.js` | Accepted (needed for hosting health checks; no secrets) |
| 8 | Info | Default `CLIENT_ORIGIN` is `http://localhost:5173`. If forgotten in production, the real site is blocked by CORS (fails closed, not open). | `server/src/config/env.js` | Set in Step 41 |
| 9 | Info | Test and QA accounts and bookings exist in the database. | MongoDB | Clean up before the demo |

## Fix details

**1. body-parser advisory.** In `server/`: `npm audit fix`, then `npm audit --omit=dev` (expect "found 0 vulnerabilities"), then rerun `npm run test:ai-service`, `npm run test:ai-route`, and a login and booking in the browser. Client audit already reports 0 vulnerabilities.

**2. Trust proxy.** Added `TRUST_PROXY` (number of proxies, default 0) and `app.set('trust proxy', n)` when it is above 0. Verified with a script that sends 25 login requests with different `X-Forwarded-For` addresses: with `TRUST_PROXY=0` they share one bucket (20 allowed, 5 blocked, plus a library warning); with `TRUST_PROXY=1` each address is counted separately.

**3. Token storage.** Mitigations in place: React escapes all text (no `dangerouslySetInnerHTML`, `innerHTML` or `eval` anywhere in `client/src`, verified by search); AI output is rendered as plain text and was tested with HTML in it; tokens expire in 1 day; the server re-reads the user on every request, so role changes and deleted users take effect immediately. Not done (out of scope for this project): httpOnly cookies, refresh tokens, token revocation list.

## Checked and found sound

- **Secrets:** `.env` was never committed (searched all Git history). `.gitignore` covers `.env` and `.env.*`, and allows `.env.example`. No API keys, tokens or private keys in tracked files. The only connection-string text is the placeholder in `server/.env.example`.
- **AI key exposure:** `AI_API_KEY` exists only in `server/.env`; the client contains no reference to it; the checking script prints only whether it is set; errors from the provider are replaced by short codes.
- **Passwords:** bcrypt cost 10; hashes are excluded from queries and JSON output; 8 to 72 character rule with letter and digit; bcrypt's 72-byte limit enforced; unknown-email logins take similar time (dummy hash); same error for wrong email and wrong password.
- **Tokens:** HS256 pinned on sign and verify; the secret must be at least 32 characters or the server refuses to start; only the user ID is in the token.
- **Authentication and authorization:** every booking and AI route requires login; the whole `/api/admin` router is admin-only by default; customers can read and change only their own bookings (403 otherwise); admins can only mark a booking completed; role cannot be set through registration.
- **Mass assignment and injection:** validators copy only approved fields; IDs must be exactly 24 hex characters; the `category` filter must be a string on the approved list (operator-injection attempts fail); login email must be a string.
- **CORS and headers:** only `CLIENT_ORIGIN` is allowed; `helmet` is on; JSON bodies are limited to 10 KB.
- **Rate limits:** auth routes 20 per 15 minutes; AI routes `AI_RATE_LIMIT_MAX` (20) per user per 15 minutes.
- **Errors and logs:** unexpected errors return a generic 500; production logs only the error name and message; AI logs contain only safe fields (feature, source, outcome, error code, latency, counts, token totals), never the customer's text.
- **AI boundaries:** customer text is limited to 3 to 300 characters, stripped of control characters, and rejected if it contains an email address or long number; it is placed inside delimited data tags with angle brackets neutralized; the system instruction is separate; output is capped at 1024 tokens, must be valid JSON, may only name services from the current menu, and is scrubbed of price, safety, medical and booking claims. The AI never creates or changes a booking. Evaluation (19 cases) found one unsupported-claim phrase ("safely"), which was fixed and rechecked.
- **Dependencies:** no unused or unexpected packages in either `package.json`; client `npm audit` reports 0 vulnerabilities.
- **Free-tier privacy:** Google may use free-tier content to improve its products. The form asks users not to include personal details, and the server rejects emails and phone numbers.
