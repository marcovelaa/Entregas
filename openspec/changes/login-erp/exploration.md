## Exploration: login-erp

### Correction to the stated premise (verified)

The product owner believed a "professional login screen" already exists in the ERP (`apps/admin`) and just needs improvement. This is **incorrect**, verified by exhaustive search:

- No `apps/admin/src/app/login/` route exists.
- No match for `login|Login|auth/login` anywhere in `apps/admin/src`.
- No `middleware.ts` anywhere in `apps/admin`.
- `apps/admin/src/app/layout.tsx` unconditionally renders `<Sidebar/>` + `<TopBar/>` around every route — no auth branch, no login exemption.

The professional-looking login the user remembers is `apps/frontend/src/app/login/page.tsx` — the **customer storefront**, a completely different app — and even there it is a **non-functional UI stub**: `handleSubmit` never calls any API, it just does `router.push('/mi-cuenta')` with a comment saying the backend call "would go here". Good visual bones (Amazon-style card, `#e77600` accent, Google button, register/forgot-password toggle) but wrong app, zero wiring, and wrong design tokens for the ERP (admin uses `--color-primary: #2BBCEE`, Montserrat/Hanken Grotesk).

**`apps/admin` has no login page, functional or not, at all.**

### Current State

1. **No login page in `apps/admin`.** `apps/admin/src/app/page.tsx` (dashboard) fetches `/dashboard/metrics` on mount with a bare `try/catch { console.error(...) }` and no redirect — this is exactly the reported symptom: silent 401s everywhere, no redirect to any login, because there is no login to redirect to.

2. **The `iam/auth` backend endpoint is real, functional, and independently verified live** (not just by code reading):
   - `apps/api/src/modules/iam/auth/auth.controller.ts`: `POST /api/auth/login` (`main.ts` sets global prefix `api`, listens on port 3001), `@Public()`, throttled 5/60s.
   - `apps/api/src/modules/iam/auth/auth.service.ts`: validates via `bcrypt.compare`, signs `access_token` (8h) and `refresh_token` (7d), returns **both in the JSON response body**. No cookies set anywhere (no `@Res`, no `res.cookie`).
   - `apps/api/src/modules/iam/auth/strategies/jwt.strategy.ts`: `ExtractJwt.fromAuthHeaderAsBearerToken()` — reads the JWT only from an `Authorization: Bearer <token>` header, never from a cookie.
   - `apps/api/src/app.module.ts`: `JwtAuthGuard` registered globally via `APP_GUARD` — every non-`@Public()` route genuinely 401s without a valid bearer JWT (confirms the earlier guard fix, commit `7aeb497`, is working as intended, no bypass left).
   - **Live verification run this session** (dev servers already running, Postgres up):
     ```
     curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" \
       -d '{"email":"admin@entregas.com.bo","password":"temporal123"}'
     # → HTTP 200, JSON body with access_token (seed default credentials work)

     curl -o /dev/null -w "%{http_code}" http://localhost:3001/api/ventas -H "Authorization: Bearer <token>"
     # → 200

     curl -o /dev/null -w "%{http_code}" http://localhost:3001/api/ventas   # no token
     # → 401
     ```
     Confirmed end to end: the backend login + guard chain works correctly. The gap is entirely client-side.

3. **Session handling in `apps/admin` is architecturally incompatible with what the backend issues today.** `apps/admin/src/lib/axios.ts` creates a bare axios instance with `withCredentials: true` but **no interceptors at all** — nothing stores a token anywhere (no localStorage, no memory, no cookie-read) and nothing ever attaches `Authorization: Bearer`. Since `iam/auth` issues bearer tokens in the JSON body (not cookies), `withCredentials: true` is currently a no-op for this auth domain.

4. **A proven cookie-based pattern already exists in this codebase, just not for `iam/auth`.** `apps/api/src/modules/clientes/auth/` (customer auth, separate domain) sets httpOnly cookies via `cookies.util.ts` and its `cliente-jwt.strategy.ts` reads the JWT via a custom cookie extractor. CORS already sets `credentials: true`, so a cookie approach for `iam/auth` is not blocked by CORS config — it would just require mirroring the `clientes/auth` pattern.

5. **Dev credentials confirmed working live**: `admin@entregas.com.bo` / `temporal123` (seed defaults, `apps/api/prisma/seed.ts`).

### Affected Areas

- `apps/admin/src/app/login/` (does not exist) — needs to be created: `page.tsx`, `page.module.css`.
- `apps/admin/src/app/layout.tsx` — unconditionally renders `Sidebar`/`TopBar`; needs a branch to exclude chrome on `/login`.
- `apps/admin/src/lib/axios.ts` — needs token attachment (interceptor) and/or reliance on cookies depending on chosen approach; needs a 401 → redirect-to-`/login` response interceptor (does not exist today anywhere in the app).
- `apps/api/src/modules/iam/auth/auth.controller.ts` / `auth.service.ts` — functional as-is for a bearer-token approach; would need cookie-issuance added if the cookie approach is chosen.
- `apps/api/src/modules/iam/auth/strategies/jwt.strategy.ts` — bearer-only extractor; would need a cookie (or dual bearer+cookie) extractor if the cookie approach is chosen. This is a **shared guard surface** — changing it affects every protected route in the ERP API, covered by `jwt-auth.guard.spec.ts`, `app.module.spec.ts`, `rbac-routes.spec.ts`.
- `apps/api/src/modules/clientes/auth/cookies.util.ts`, `cliente-jwt.strategy.ts` — reference pattern to mirror if the cookie approach is chosen.
- `apps/frontend/src/app/login/page.tsx` + `page.module.css` — usable as **visual/UX inspiration only** (form structure, states to add), not portable as-is: wrong app, wrong design tokens, itself non-functional.

### Approaches

1. **Cookie-based session (mirror the existing `clientes/auth` pattern)** — add httpOnly cookie issuance to `iam/auth` login, extend/replace `JwtStrategy`'s extractor to read from cookie, admin login page POSTs to `/api/auth/login` and relies on the already-present `withCredentials: true` (no client-side token code needed), add a 401 interceptor + layout branch for redirect.
   - Pros: matches a pattern already proven in this exact codebase; token never touches JS (lower XSS exposure); `withCredentials: true` is already sitting there unused.
   - Cons: touches the shared `iam/auth` guard/strategy surface used by every protected ERP route; must decide whether to keep bearer-header support too (Swagger already advertises Bearer auth) or fully replace it.
   - Effort: Medium.

2. **Bearer-token + admin-side storage/interceptor (backend untouched)** — build the login page, on success store `access_token` (in-memory or `sessionStorage`), add an axios request interceptor to attach `Authorization: Bearer`, add a response interceptor for 401 → redirect to `/login`, gate the layout on auth state.
   - Pros: zero backend changes, zero risk to existing `iam/auth` tests/behavior/any other consumer, smallest diff, fastest to ship.
   - Cons: token management logic has to be built from scratch in `apps/admin`; storing the token anywhere JS-reachable carries XSS exposure unless kept strictly in-memory, which then needs the `refresh_token` flow wired to survive page reloads.
   - Effort: Low-Medium.

### Recommendation

Lean toward **Approach 2** for a first working slice (smallest, lowest-risk diff, no shared-guard blast radius), with Approach 1 flagged as a stronger long-term option given the pattern already exists and is proven for `clientes/auth`. This is a real fork with meaningful tradeoffs (backend blast radius vs. client-side token exposure) — `sdd-propose` should present both explicitly and let the user pick.

### Risks

- **Scope-premise correction.** The user's assumption of an existing ERP login is factually wrong and has been corrected here — this is a "build from scratch" job (informed by `apps/frontend`'s visual style, adapted to admin's own design tokens), not a "polish an existing screen" job.
- **Backend session-strategy choice changes blast radius materially** (Approach 1 touches shared guard/strategy code covered by 3 existing spec files; Approach 2 does not) — needs explicit user confirmation before `sdd-design`.
- **Layout coupling**: `apps/admin/src/app/layout.tsx` renders global chrome unconditionally; adding `/login` requires an explicit exclusion mechanism (pathname check or route group), not just adding a page file.
- Runtime login+guard chain has now been **verified live** (see Current State §2) — this risk from the initial pass is closed.

### Ready for Proposal

Yes. Live verification is done. `sdd-propose` should present the Approach 1 vs. Approach 2 fork explicitly for the user to choose, along with the "no existing ERP login" scope correction (already communicated to the user by the orchestrator).
