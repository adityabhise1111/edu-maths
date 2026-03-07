## Plan: Backend Sentry Additive Integration

This plan integrates Sentry into `edu-maths/backend` only, using additive-only changes and preserving all existing behavior, middleware order, and `apminsight` coexistence. The execution sequence starts by creating `edu-maths/backend/sentryplan.md`, then applies minimal additive hooks for startup initialization, request context enrichment, Express error capture, and process-level crash capture, followed by build/runtime safety verification.

**Steps**
- [x] Step 1 — Baseline and guardrails
  - Confirm no implementation starts until this plan is accepted.
  - Confirm additive-only policy: no deletions, no refactors, no formatting changes, no reordering existing code.
  - Record hard stop condition: if any required behavior needs editing existing logic beyond additive insertion, pause and ask user.
  - Capture starting git status as reference for green-only diff verification at the end.

- [x] Step 2 — Create required plan artifact in repository (`sentryplan.md`)
  - Create `c:/Users/Aditya Bhise/OneDrive/Desktop/edu-front-integration/edu-maths/backend/sentryplan.md`.
  - Copy this full checklist plan into that file verbatim so implementation can be tracked in-file by checkbox updates.
  - This is additive file creation only.

- [x] Step 3 — Package requirement declaration (no auto-install)
  - Required package: `@sentry/node`.
  - Provide command only (do not run automatically): `npm install @sentry/node`.
  - Stop and wait for user confirmation after sharing the command.
  - If user confirms package is installed, continue; if not, do not proceed to code additions.

- [x] Step 4 — Current backend request lifecycle documentation (ground truth)
  - Document in `sentryplan.md` the current runtime flow observed from code:
  - `src/server.ts`: `dotenv/config` loads first, then `apminsight` config, then imports `app`, then `app.listen`, DB test, Redis init, cron startup.
  - `src/app.ts`: middleware order is `cors` → `express.json` → `express.urlencoded` → `requestIdMiddleware` → `clerkMiddleware` → route mounts (`/api/health`, `/api/auth`, `/api/academy`, `/api/students`, `/api/exams`, `/api/teacher`, `/api/resources`).
  - Route handlers mostly use local try/catch and return 4xx/5xx JSON directly; no centralized Express error middleware currently present.
  - Request correlation exists via `requestIdMiddleware` (`req.requestId`, `X-Request-ID`).

- [x] Step 5 — Environment variable additions (names only)
  - Add only new variable placeholders to `c:/Users/Aditya Bhise/OneDrive/Desktop/edu-front-integration/edu-maths/backend/.env.example` (additive lines only):
  - `SENTRY_DSN`
  - `SENTRY_ENABLED`
  - `SENTRY_ENVIRONMENT`
  - `SENTRY_RELEASE`
  - `SENTRY_TRACES_SAMPLE_RATE`
  - Add same names to `.env` only as placeholders if requested by user; otherwise reference names in code and leave values for user.
  - Do not commit secrets or real DSN values.

- [x] Step 6 — Create Sentry bootstrap module (new file)
  - Create `c:/Users/Aditya Bhise/OneDrive/Desktop/edu-front-integration/edu-maths/backend/src/utils/sentry.ts`.
  - Add an initialization function that:
  - Reads env vars safely and enables Sentry only when `SENTRY_ENABLED=true` and DSN exists.
  - Calls `Sentry.init` with conservative production-safe defaults.
  - Sets `environment` and `release` from env vars.
  - Sets low/no tracing sample rate by default if not provided.
  - Adds integrations for Express/HTTP context supported by installed SDK.
  - Adds `beforeSend` guard to avoid noisy expected 4xx events.
  - Export helper functions for capture (`captureException`, `captureMessage`) used by additive hooks.
  - Add comments above each newly added block explaining purpose.

- [x] Step 7 — Add startup initialization insertion point (additive in `server.ts`)
  - In `c:/Users/Aditya Bhise/OneDrive/Desktop/edu-front-integration/edu-maths/backend/src/server.ts`, insert new imports and one init call only.
  - Insertion location: after existing imports are declared (without altering existing lines), then call Sentry init before `app.listen` so startup/runtime exceptions are captured.
  - Keep `apminsight` intact and active.
  - Add comments explaining why initialization occurs early and why coexistence is intentional.

- [x] Step 8 — Add request context and lightweight request instrumentation (additive in `app.ts`)
  - In `c:/Users/Aditya Bhise/OneDrive/Desktop/edu-front-integration/edu-maths/backend/src/app.ts`, insert additive middleware after `requestIdMiddleware` and before route mounts.
  - Middleware responsibilities:
  - Attach `requestId`, route, method, and optional user identifiers (`clerkUserId`/`studentId` when available later in lifecycle) to Sentry scope.
  - Do not mutate existing request handling behavior.
  - Avoid capturing normal successful requests as errors.
  - Add comments explaining context propagation intent.

- [x] Step 9 — Add centralized Express error-capture middleware (additive in `app.ts`)
  - Append a new final error-handling middleware after all existing `app.use('/api/...')` route mounts.
  - Middleware captures uncaught errors with Sentry and includes request metadata.
  - Preserve API behavior by returning existing generic 500 shape (`error`, `message`) and include `requestId` only if aligned with existing response strategy; if this changes response contract, pause and ask before adding.
  - Ensure middleware is additive and does not replace existing route-level try/catch blocks.
  - Add comments above block explaining fallback behavior and non-invasive design.

- [x] Step 10 — Add process-level safety handlers (additive in `server.ts`)
  - Add `process.on('unhandledRejection', ...)` and `process.on('uncaughtException', ...)` handlers.
  - Capture exceptions to Sentry and keep conservative process behavior (do not alter shutdown semantics unless explicitly requested).
  - Add comments explaining crash telemetry purpose.

- [x] Step 11 — Optional targeted captures for swallowed errors (additive only)
  - Review known swallowed/non-fatal catch points (for example Redis cache invalidation catches) and add non-blocking `captureException` calls only where this does not alter control flow.
  - If insertion would require touching many existing blocks and risks accidental refactor, stop and ask whether to defer to phase 2.

- [x] Step 12 — Production/build safety checks
  - Run type/build check: `npm run build`.
  - Run dev boot smoke check: start server and verify no startup crash when Sentry vars are missing (Sentry disabled path).
  - Verify with `SENTRY_ENABLED=true` and DSN placeholder absent that startup still stays safe (warn/log only, no crash).
  - Verify existing health/auth route behavior remains unchanged.

- [x] Step 13 — Diff policy verification (green-only)
  - Validate diff contains only:
  - New files (`sentryplan.md`, `src/utils/sentry.ts`),
  - Additive insertions in existing files,
  - Additive env placeholder lines.
  - Confirm no deletions/modifications/reformatting occurred.
  - If any red deletion appears, stop and ask before proceeding.

**Relevant files**
- `c:/Users/Aditya Bhise/OneDrive/Desktop/edu-front-integration/edu-maths/backend/src/server.ts` — startup order, initialization hook location, process-level handlers.
- `c:/Users/Aditya Bhise/OneDrive/Desktop/edu-front-integration/edu-maths/backend/src/app.ts` — middleware chain, route mounts, final error middleware insertion.
- `c:/Users/Aditya Bhise/OneDrive/Desktop/edu-front-integration/edu-maths/backend/src/middlewares/requestId.ts` — existing correlation source used to enrich Sentry scope.
- `c:/Users/Aditya Bhise/OneDrive/Desktop/edu-front-integration/edu-maths/backend/src/middlewares/auth.ts` — current auth context fields (`clerkUserId`, `studentId`, `academyId`) relevant for safe scope enrichment.
- `c:/Users/Aditya Bhise/OneDrive/Desktop/edu-front-integration/edu-maths/backend/src/routes/exams.ts` — representative local try/catch and swallowed Redis errors for optional additive capture.
- `c:/Users/Aditya Bhise/OneDrive/Desktop/edu-front-integration/edu-maths/backend/.env.example` — additive environment variable names.
- `c:/Users/Aditya Bhise/OneDrive/Desktop/edu-front-integration/edu-maths/backend/.env` — local secret values (user-managed only).
- `c:/Users/Aditya Bhise/OneDrive/Desktop/edu-front-integration/edu-maths/backend/package.json` — dependency presence verification only; no manual edits for package install.
- `c:/Users/Aditya Bhise/OneDrive/Desktop/edu-front-integration/edu-maths/backend/sentryplan.md` — execution checklist artifact with live checkbox progress.
- `c:/Users/Aditya Bhise/OneDrive/Desktop/edu-front-integration/edu-maths/backend/src/utils/sentry.ts` — new Sentry bootstrap/capture helpers.

**Verification**
1. Confirm package install command was user-approved and manually executed: `npm install @sentry/node`.
2. Confirm env placeholders exist and no real secrets are committed.
3. Build passes: `npm run build` in `edu-maths/backend`.
4. Runtime smoke: start server with current `.env`; verify normal startup and route health.
5. Error path smoke: trigger a controlled thrown error route/path and confirm Sentry capture call executes without breaking response.
6. Confirm no API contract regression for existing 4xx/5xx payloads unless explicitly approved.
7. Confirm git diff is additive-only (green additions).

**Decisions**
- Include now: backend Sentry plan and backend-first execution path.
- Exclude now: frontend/mobile Sentry integration (deferred to next phase as requested).
- Keep `apminsight` active and add Sentry alongside.
- Use npm commands only.
- Enforce strict additive-only edits and stop-on-ambiguity behavior.

**Further Considerations**
1. 4xx capture policy recommendation: do not send expected validation/auth 4xx to Sentry by default to reduce noise; keep only unexpected 5xx and unhandled exceptions.
2. Sampling recommendation: start with low tracing sample rate in production and adjust after baseline volume is observed.
3. Frontend phase handoff: after backend is stable, create a separate frontend-only Sentry plan with its own env keys and release handling.
