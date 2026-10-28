---
title: "July's Salon — Smart Appointment and Service Booking Platform"
subtitle: "Software Development Life Cycle (SDLC) Documentation"
author: "GitHub: jasonharwell61 — UT Arlington AI-Centric Software Engineering Bootcamp Capstone"
date: "October 2026"
---

> **How to read this document.** Anything marked **[ADD]** is evidence only the author can supply (screenshots, personal reflections, manual test results). Nothing in this document claims testing that was not run. Where a result was not yet recorded, it says so.

# 1. Project overview

July's Salon is a full-stack web application for an eyelash salon. Customers browse services, ask an AI assistant which service fits their request, book an appointment, and manage their bookings. An admin can see all bookings and manage services.

| Item | Value |
|---|---|
| Live frontend | https://julys-salon-booking.vercel.app |
| Live API | https://julys-salon-api.onrender.com |
| Health check | https://julys-salon-api.onrender.com/api/health |
| Repository | https://github.com/jasonharwell61/julys-salon-booking |
| Stack | React 19 + Vite 8, Node.js + Express 5, MongoDB Atlas + Mongoose 9, Google Gemini |
| Hosting | Vercel (client), Render free web service (API), MongoDB Atlas free cluster (database) |

# 2. Problem statement

Small appointment businesses often take bookings through texts and direct messages. This causes double bookings, missed messages, and no reliable record of who is coming and when. Customers also find it hard to choose between similar services (for example Classic, Volume and Hybrid lash sets).

The platform addresses both problems: the server enforces booking rules so the same time cannot be booked twice, and a grounded AI assistant helps customers choose from the salon's real service list.

# 3. Scope

**In scope**

- Account registration and login with role-based access (customer, admin)
- Service catalog with categories, durations, prices and tags
- Booking with business-hours, notice-time, booking-window and no-overlap rules
- Customer booking management: view, reschedule, edit note, cancel
- Admin bookings view with status filter; admin marks bookings completed; admin manages services
- AI Lash Service Recommender (AI Feature A) with safe fallback
- Deployment to public hosting, with documentation and tests

**Out of scope (not built)**

- Online payments or deposits
- Email or SMS confirmations and reminders
- Multiple staff members or locations
- Admin-editable business hours
- Service Comparison Helper (planned optional AI Feature B; skipped for time)

# 4. Target users

| User | Needs |
|---|---|
| Customer | Find the right service, book a time quickly, change or cancel without calling |
| Salon admin / owner | See all appointments, avoid double bookings, keep the service list current |

# 5. User stories and acceptance criteria

| ID | User story | Acceptance criteria |
|---|---|---|
| US-01 | As a visitor, I can create an account so I can book. | Valid name, email and password creates an account and logs me in. Duplicate email is rejected with a clear message. Weak password shows a field error. The response never includes the password hash. A `role` sent in the body is ignored (new users are customers). |
| US-02 | As a user, I can log in and stay logged in. | Correct credentials log me in. Wrong password and unknown email give the same message. A page refresh keeps me logged in. A garbage token is treated as logged out without crashing. |
| US-03 | As a visitor, I can browse services. | Active services show name, category, price and duration. Category filter works. Unknown service ID shows "not found". Inactive services are hidden. |
| US-04 | As a customer, I can book a service at an available time. | Only valid slots (Mon–Sat, 9:00–18:00 Central Time, 15-minute grid, at least 2 hours ahead, within 90 days) are accepted. An overlapping booking returns 409 and a friendly message. Price and duration are copied from the service at booking time. |
| US-05 | As a customer, I can view, reschedule, edit the note of, and cancel my bookings. | I see only my own bookings. Another user's booking returns not found. Rescheduling re-applies all booking rules. Cancel sets the status to cancelled and frees the slot. |
| US-06 | As an admin, I can see all bookings and mark them completed. | Admin view lists every booking with customer name and email and filters by status. Customers cannot access it. Only admins can mark completed. |
| US-07 | As an admin, I can create, edit and deactivate services. | Admin-only endpoints. Deactivating hides the service from customers but keeps old bookings intact (snapshot). |
| US-08 | As a customer, I can describe what I want and get service suggestions. | Logged-in users only. Input 3–300 characters. Up to 3 suggestions, each a real service with a short reason. Price and duration come from the database. If AI fails, I still get fallback suggestions, labeled as such. The AI cannot create a booking. |
| US-09 | As a user, I get clear feedback on every screen. | Loading, empty and error states exist. Errors show friendly text, not stack traces. |

# 6. Requirements

## 6.1 Functional requirements

| ID | Requirement |
|---|---|
| FR-1 | Users can register, log in and retrieve their profile. |
| FR-2 | The system supports two roles, customer and admin, with different permissions. |
| FR-3 | The system lists and filters services publicly. |
| FR-4 | Admins can create, update and deactivate services. |
| FR-5 | Customers can create bookings subject to the business rules in Section 6.3. |
| FR-6 | Customers can read, reschedule, edit notes on, and cancel only their own bookings. |
| FR-7 | Admins can list all bookings and mark them completed. |
| FR-8 | The system suggests up to 3 services from a free-text request using an AI provider, grounded in the real service list. |
| FR-9 | The system falls back to keyword matching if the AI is unavailable, times out or returns invalid output. |

## 6.2 Non-functional requirements

| ID | Category | Requirement | How it is met |
|---|---|---|---|
| NFR-1 | Security | Passwords are never stored in plain text | bcryptjs hashing; `passwordHash` hidden from API output |
| NFR-2 | Security | Protected routes require authentication; admin routes require the admin role | JWT middleware and role middleware |
| NFR-3 | Security | Brute-force and abuse limits | Auth routes limited to 20 requests per 15 minutes per IP; AI route limited per user |
| NFR-4 | Security | Secrets are not in the repository | `.env` ignored by git; `.env.example` has placeholders; production secrets set in host dashboards |
| NFR-5 | Security | Input is validated on the server | Validators return field-level errors; 10 kb JSON limit |
| NFR-6 | Reliability | No double booking | Overlap check plus an in-process slot lock (single-instance protection) |
| NFR-7 | Reliability | AI failure must not break the feature | Timeout (15 s) and keyword fallback |
| NFR-8 | Privacy | Customer AI text is not stored or logged; personal data is not sent to the AI | Logger records safe fields only; emails and long digit strings are rejected |
| NFR-9 | Usability | Responsive on phone and desktop; accessible states | Bootstrap layout, custom CSS, `aria-live` on AI results |
| NFR-10 | Maintainability | Clear structure and tests | Layered server (routes, controllers, services, models, validators); automated test scripts |
| NFR-11 | Availability | Public deployment | Vercel + Render + Atlas. Free-tier API sleeps after 15 minutes idle (about 1 minute to wake). |

## 6.3 Business rules

Timezone America/Chicago. Open Monday–Saturday 9:00–18:00. 15-minute time grid. Minimum notice 2 hours. Booking window 90 days. A booking must fit entirely inside opening hours. Overlapping bookings are rejected (409). Prices are stored in cents. Times are stored as ISO UTC. Statuses: `confirmed`, `completed`, `cancelled`.

# 7. Wireframes

Low-fidelity layouts of the implemented screens. **[ADD]** Replace or supplement these with your own hand sketches or screenshots if your instructor wants originals. Screenshots from a local test run (sample data) are in `docs/screenshots/`.

**Services page with AI assistant**

```
+--------------------------------------------------+
| July's Salon   Home Services MyBookings Account  |
+--------------------------------------------------+
| Services                                         |
| [ Describe what you want...            ] [Ask]   |
|   -> up to 3 suggestions with reasons            |
| [All] [Full Sets] [Fills] ...   [search....]     |
| +------------+ +------------+ +------------+     |
| | Service    | | Service    | | Service    |     |
| | $ / time   | | $ / time   | | $ / time   |     |
| | [Details]  | | [Details]  | | [Details]  |     |
| +------------+ +------------+ +------------+     |
+--------------------------------------------------+
```

**Service detail and booking**

```
+--------------------------------------------------+
| <- All services                                  |
| CATEGORY                                         |
| Service name                                     |
| description                                      |
| PRICE  TIME        [tag] [tag]                   |
| +----------------------------+                   |
| | Book this service          |                   |
| | Date  [ mm/dd/yyyy ]       |                   |
| | Time  [ available slots v ]|                   |
| | Note  [ optional ] 0/300   |                   |
| | [ BOOK APPOINTMENT ]       |                   |
| +----------------------------+                   |
+--------------------------------------------------+
```

**My bookings / Admin bookings**

```
+--------------------------------------------------+
| My bookings            (Admin: All bookings)     |
| (Admin: [All][Confirmed][Completed][Cancelled])  |
| +----------------+ +----------------+            |
| | Service  STATUS| | Service  STATUS|            |
| | Date/time CT   | | Date/time CT   |            |
| | duration/price | | duration/price |            |
| | note           | | (admin: customer name,     |
| | [Change][Cancel]| |  email, Mark completed)   |
| +----------------+ +----------------+            |
+--------------------------------------------------+
```

# 8. Three-tier architecture

| Tier | Technology | Responsibility |
|---|---|---|
| Presentation | React + Vite single-page app on Vercel | Screens, forms, routing, protected routes, calls the API with a Bearer token. Contains no secrets. |
| Application / logic | Node.js + Express API on Render | Authentication, authorization, validation, booking rules, AI orchestration, error handling, rate limiting |
| Data | MongoDB Atlas via Mongoose | Persistent users, services and bookings |

```
 Browser (React SPA, Vercel)
        |  HTTPS, Authorization: Bearer <JWT>
        v
 Express API (Render)  ----> Gemini API (server-side only, key in env)
        |  Mongoose            (fallback: keyword matcher)
        v
 MongoDB Atlas (julys_salon_prod)
```

Separation of concerns on the server: **routes** map URLs to **controllers**; controllers call **services** (business logic, such as `bookingService` and the AI service); services use **models** (Mongoose schemas); **validators** check input; **middleware** handles authentication, rate limiting and errors. The browser only talks to the API; only the API talks to the database and the AI provider.

# 9. Database schema and relationships

MongoDB with three collections.

**users**

| Field | Notes |
|---|---|
| `name` | required |
| `email` | required, unique (unique index), lowercase |
| `passwordHash` | bcrypt hash; never returned by the API |
| `role` | `customer` (default) or `admin` |
| timestamps | created and updated |

**services**

| Field | Notes |
|---|---|
| `name`, `category`, `description` | `category` is an enumerated value |
| `durationMinutes` | validated number |
| `priceCents` | integer, avoids floating-point money errors |
| `tags` | validated array of short strings |
| `isActive` | false hides the service (soft delete) |
| index | `{ isActive: 1, category: 1 }` for the public menu query |

**bookings**

| Field | Notes |
|---|---|
| `user` | reference to `users` |
| `service` | reference to `services` |
| `serviceSnapshot` | copy of name, duration and price at booking time |
| `startTime`, `endTime` | UTC dates; end must be after start |
| `status` | `confirmed`, `completed`, `cancelled` |
| `customerNote` | optional, up to 300 characters |
| `cancelledAt` | set on cancel |
| indexes | `{ user: 1, startTime: 1 }` and `{ startTime: 1 }` for "my bookings" and overlap checks |

**Relationships:** one user has many bookings; one service has many bookings; each booking belongs to exactly one user and one service (one-to-many, both directions, using ObjectId references). The **snapshot** keeps old bookings accurate if a service's price or name changes later or the service is deactivated.

# 10. REST API design

JSON over HTTPS. Errors use one shape: `{ "error": "message", "details": [ { "field": "...", "message": "..." } ] }`.

| Method | Endpoint | Access | Purpose | Typical status codes |
|---|---|---|---|---|
| GET | `/api/health` | Public | Server and database status | 200 |
| POST | `/api/auth/register` | Public | Create account (role forced to customer) | 201, 400, 409, 429 |
| POST | `/api/auth/login` | Public | Log in, return JWT | 200, 400, 401, 429 |
| GET | `/api/auth/me` | User | Current user | 200, 401 |
| GET | `/api/services` | Public | List active services (`?category=`) | 200, 400 |
| GET | `/api/services/:id` | Public | One service | 200, 404 |
| POST | `/api/services` | Admin | Create service | 201, 400, 401, 403 |
| PATCH | `/api/services/:id` | Admin | Update service | 200, 400, 403, 404 |
| DELETE | `/api/services/:id` | Admin | Deactivate service | 200, 403, 404 |
| POST | `/api/bookings` | User | Create booking | 201, 400, 401, 404, 409 |
| GET | `/api/bookings/mine` | User | My bookings | 200, 401 |
| GET | `/api/bookings/:id` | Owner or admin | One booking | 200, 404 |
| PATCH | `/api/bookings/:id` | Owner (customer: time/note); admin (mark completed) | Reschedule, edit note, complete | 200, 400, 403, 404, 409 |
| DELETE | `/api/bookings/:id` | Owner (admin may also cancel) | Cancel booking (customers cannot cancel past appointments) | 200, 404, 409 |
| GET | `/api/admin/services` | Admin | All services including inactive | 200, 403 |
| GET | `/api/admin/bookings` | Admin | All bookings (status filter) | 200, 403 |
| POST | `/api/ai/recommend-service` | User | AI recommendation | 200, 400, 401, 429 |

Design choices: nouns for resources, HTTP verbs for actions, status codes that match outcomes (409 for conflicts, 429 for rate limits), and validation on every input.

# 11. Authentication and authorization design

**Authentication.** Users register with name, email and password. Passwords are hashed with bcryptjs. Login returns a signed JWT (HS256) containing only the user ID. The secret must be at least 32 characters and is stored only in environment variables. Tokens expire (1 day). The client sends the token in the `Authorization: Bearer` header. Login failures return the same message for a wrong password and an unknown email, to avoid revealing which emails exist.

**Authorization.** Middleware verifies the token, loads the user from the database, and attaches it to the request. A role middleware restricts admin routes. Booking endpoints check ownership: a customer asking for someone else's booking gets "not found" (does not reveal that it exists). Admin privileges cannot be self-assigned at registration; an admin is created by changing the role in the database.

**Other protections.** helmet security headers, CORS restricted to the exact frontend origin, rate limiting on auth and AI routes, request size limit, centralized error handler that hides internals.

**Known tradeoffs.** The token is kept in `localStorage`, which is simple but exposed to XSS. Logout removes the token from the browser only; a copied token stays valid until it expires. These are recorded in `docs/security-review.md`.

# 12. AI feature: purpose, flow, limitations, safety, evaluation

**Purpose.** Help a customer who does not know which service to choose. The AI suggests; the customer decides and books manually.

**Flow.**

1. Logged-in customer types a request (3–300 characters).
2. Server validates the input (control characters stripped; emails and long digit runs rejected).
3. Server loads active services from the database and sends only id, name, category, description, duration, price and tags.
4. The customer's text is wrapped in `<customer_message>` tags with angle brackets neutralized (prompt-injection resistance).
5. Gemini returns structured JSON.
6. Server validates the JSON, keeps only service IDs that exist, removes duplicates, caps at 3, trims text, and replaces any reason or summary that makes unsupported claims (prices, guarantees, safety, medical, discounts, availability, "booked/confirmed").
7. Server fills in real names, prices and durations from the database and returns the result.
8. On provider error, timeout (15 s) or bad output, a keyword matcher answers instead and the response is labeled `fallback`.

**Limitations.** It is not a consultation and cannot assess allergies, eye health or suitability. Quality depends on the model and the service descriptions. The free Gemini tier may let the provider use submitted content to improve its products, which is why personal data is blocked at input.

**Safety controls.** Grounding in database data; ID whitelist; claim filter; input limits; per-user rate limit (default 20 per 15 minutes); API key on the server only; logs contain no customer text; the AI cannot create, change or cancel bookings.

**Evaluation.** A fixed set of 19 test cases (normal requests, vague requests, off-topic requests, prompt-injection attempts, requests with personal data, unsupported claims) is run by `npm run eval:ai`, which writes `docs/ai-evaluation-results.md`. The first run flagged one case for human review (a reason containing the word "safely"). After tightening the claim filter, the second run recorded 19 pass, 0 review, 0 fail on the automated checks. **[ADD]** The usefulness ratings (1–5) and reviewer notes in that file have not been filled in yet; add them before submitting and do not describe them as completed until you do.

# 13. Testing evidence

All automated tests run from `server/` with `npm test` and use fakes, so they need no database or API key.

| Test area | Script | Checks | Status |
|---|---|---|---|
| Booking rules (hours, notice, window, grid) | `test:booking-rules` | rule-based | Passing in the last local run |
| Ownership / authorization | `test:ownership` | rule-based | Passing in the last local run |
| AI service (validation, injection, bad output, fallback, whitelist) | `test:ai-service` | 48 | 48 passed, 0 failed |
| AI route (auth, validation, rate limit shape) | `test:ai-route` | 16 | Passing in the last local run |
| Booking race condition (slot lock) | `test:booking-race` | 8 | Passing in the last local run |
| AI evaluation set | `eval:ai` | 19 cases | 19 pass, 0 review, 0 fail (automated checks) |
| Frontend | `npm run lint`, `npm run build` | — | Lint clean, build passes |
| Dependencies | `npm audit` | — | 0 vulnerabilities at last check |

**Manual and live testing.** A full manual test plan with 74 cases mapped to requirements is in `docs/test-plan.md`. Its Status and Actual columns were generated as "Not run". The author performed a live smoke test of the production site covering register, login, services, AI recommendation, booking, change and cancel, logout, page refreshes and data persistence, and reported that it worked. Postman checks of the AI endpoint returned the expected 200 (valid request), 400 (invalid body) and 401 (no token).

**[ADD]** Fill in the Actual and Status columns of `docs/test-plan.md` for the tests you actually run, and insert screenshots here: (1) terminal showing `npm test` all passing, (2) Postman 200/400/401 results, (3) live-site booking, (4) admin view, (5) AI suggestions.

A failed test with a documented fix is acceptable evidence; do not mark a test as passed unless you ran it.

# 14. Deployment architecture and links

| Component | Host | Configuration |
|---|---|---|
| Database | MongoDB Atlas free cluster | Database `julys_salon_prod`; dedicated user with `readWrite` on that database only; network access `0.0.0.0/0` because Render's free tier has no fixed outbound IP (protected by a strong password and least-privilege user) |
| API | Render free web service | Root directory `server`; build `npm install`; start `npm start`; health check `/api/health`; Node 24; environment variables set in the dashboard |
| Frontend | Vercel Hobby | Root directory `client`; Vite preset; output `dist`; `vercel.json` rewrite so page refreshes work; `VITE_API_BASE_URL` points to the API |

Links: frontend https://julys-salon-booking.vercel.app, API https://julys-salon-api.onrender.com, health https://julys-salon-api.onrender.com/api/health.

Environment variable names: server — `PORT`, `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_ORIGIN`, `AI_PROVIDER`, `AI_MODEL`, `AI_API_KEY`, `AI_TIMEOUT_MS`, `AI_RATE_LIMIT_MAX`, `TRUST_PROXY`; client — `VITE_API_BASE_URL`. Values are never committed.

Free-tier note: the API sleeps after 15 minutes idle; the first request can take about a minute.

**[ADD]** Screenshots of the Render service, Vercel deployment and Atlas collections (hide secrets).

# 15. Git development evidence

The repository has 30 commits between October 19 and October 27, 2026, each representing one working step. Examples (hash, date, message):

| Date | Commit | Message |
|---|---|---|
| Oct 19 | a537013 | Set up Express server skeleton with health route and error handling |
| Oct 21 | f20ff77 | Connect Express to MongoDB Atlas with Mongoose |
| Oct 21 | 687eb0e | Add Booking model with service snapshot and time indexes |
| Oct 22 | 6a5e215 | Implement registration, login and current-user API with JWT |
| Oct 22 | b50316b | Add booking creation with business rules and conflict detection |
| Oct 25 | bfa5dbc | Connect service screens to the API with black and gold theme |
| Oct 25 | 6c8a47f | Add AI recommendation service with validation and keyword fallback |
| Oct 25 | b6105ca | Add AI evaluation results and tighten safety-claim filter |
| Oct 25 | e328c47 | Prevent double booking with a slot lock; add race test; cleanup |
| Oct 27 | 0f2aca3 | Add deployment plan, readiness audit and SPA rewrite |
| Oct 27 | 46ef953 | Document setup, AI feature, and architecture |

Commit 9038f10 (Oct 25, "Replace JWT secret with placeholder in env example") and the later security review document an honest correction: an early `.env.example` commit (e9ec178) contained a real-looking JWT secret. The secret was rotated everywhere it was used; the git history was not rewritten, so the old value remains visible in history but is no longer valid.

**[ADD]** A screenshot of `git log --oneline` and of the GitHub commit history page.

# 16. How AI assisted development

Claude (Anthropic) acted as a mentor and reviewer through a step-by-step plan: one step at a time, each with files, commands, expected results, negative tests and a security check. The author created and ran the files, ran the tests, committed to Git, configured Atlas, Render and Vercel, and asked questions when something was unclear. AI also helped with debugging from pasted error messages and with drafting documentation. The shipped product uses Google Gemini at runtime for the recommender.

What AI did not do: it did not receive secrets (the author was told not to paste connection strings or keys into chat), it did not deploy on its own, and the author remained responsible for understanding and approving each change.

# 17. Examples of AI output reviewed, corrected and tested

| # | What happened | How it was caught | Fix and proof |
|---|---|---|---|
| 1 | The evaluation run flagged an AI reason containing "safely", which implies a safety claim the salon cannot support. | Automated claim check marked it for human review; the author reviewed the case. | Claim filter extended to cover `safe`, `safely`, `safest`; re-run gave 19 pass, 0 review. Covered by the 48-check AI service test. |
| 2 | An assistant statement that "no secrets are in tracked files" was wrong. | A later review of git history found a real-looking JWT secret in an old `.env.example` commit. | Statement corrected in the security review; secret rotated in Render and locally; documented as finding #10. |
| 3 | Booking creation checked for overlaps and then saved, which allowed two simultaneous requests to both pass the check. | Security/reliability review of the code path. | Added a slot lock around check and save, plus a race test (8 checks) using a deliberately slow fake database. Limitation (single process) documented. |
| 4 | The author's `npm run test:ai-service` showed 46 passed instead of the expected 48. | The expected count did not match. | Found that some files had not been written to the author's disk; they were re-saved and the count returned to 48. Shows why counts are checked, not just "no failures". |
| 5 | An assistant claim that the booking-rule tests depended on the current date was wrong. | Re-reading the test showed it uses a fixed "now". | Claim retracted; tests left unchanged. |
| 6 | The AI Postman call returned "Invalid JSON in request body". | Server validation. | Body corrected to `{"message": "..."}`; same request then returned a valid recommendation. The error response also demonstrated the validation working. |

# 18. Lessons learned and future improvements

**Lessons learned.** **[ADD]** Write 3–5 sentences in your own words. Points that are supported by this project's history:

- Never let the AI be the source of truth: prices, IDs and durations come from the database, and AI text is validated.
- Small tests with exact counts catch problems "it ran without errors" would miss.
- Secrets can leak through history, not just current files; rotate first, then clean up.
- Free-tier hosting has real constraints (sleep, no fixed IP) that must be documented honestly.
- Building one verified step at a time made debugging much easier.

**Future improvements.** Email/SMS confirmations and reminders; payments or deposits; multiple staff and locations; database-level double-booking guard (unique slot index or transactions) before running multiple server instances; HttpOnly-cookie sessions with refresh tokens and server-side revocation; admin-editable hours and holidays; the Service Comparison Helper (grounded AI comparison of two services); end-to-end browser tests in continuous integration; a paid AI tier or alternative provider for stricter data handling.
