# Tasks: ERP Login for `apps/admin`

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~650-800 (16 files: 9 new, 7 modified — dominated by `auth-session.ts`, `AppShell.tsx`, the login page + its CSS, and the two new Vitest test files) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Session & HTTP foundation: `api-base-url.ts`, `auth-session.ts` (+ test), `axios.ts` interceptors (+ test), Vitest setup (`vitest.config.ts`, `package.json`, `turbo.json`) | PR 1 | `cd apps/admin && npx vitest run src/lib` | N/A — pure lib logic, nothing renders it yet in this slice | Revert commit; nothing else in the app imports these exports until Unit 2 lands, and `axios.ts`'s interceptors are additive appended blocks |
| 2 | UI wiring: `AppShell` (bootstrap + route gate), `login/page.tsx`, `layout.tsx` gate swap, `Sidebar` logout button | PR 2 | `cd apps/admin && npx tsc --noEmit` | Manual: `pnpm dev` (api `:3001`, admin `:3002`), seed creds `admin@entregas.com.bo` / `temporal123` — full login/logout/401/reload flow | Revert commit; Unit 1's lib files remain but become dead code until re-wired, no runtime impact |

Orchestrator: ask the user which chain strategy to use before `sdd-apply` — **stacked-to-main** (PR 1 merges first, PR 2 branches from post-merge `main`) or **feature-branch-chain** (PR 2 targets PR 1's branch directly, since Unit 2 depends on Unit 1's new exports). `size:exception` is not recommended here — the two units have a clean, real dependency boundary.

## Phase 1: Foundation & Test Infrastructure

- [x] 1.1 Create `apps/admin/src/lib/api-base-url.ts` exporting `apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "/api"` — single source of truth, replaces the local `const` currently duplicated in `axios.ts`.
- [x] 1.2 Add `vitest` to `apps/admin/package.json` devDependencies; add `"test": "vitest run"` script.
- [x] 1.3 Create `apps/admin/vitest.config.ts`: `environment: 'node'` (no jsdom), `include` scoped to `src/lib/**/*.test.ts` only — no RTL, no component tests.
- [x] 1.4 Add a `"test"` task to root `turbo.json` (`dependsOn: ["^test"]`, matching the `lint`/`check-types` shape) so `npx turbo run test` actually runs this suite.

## Phase 2: Session Store (`auth-session.ts`) — TDD

- [x] 2.1 RED — Create `apps/admin/src/lib/auth-session.test.ts`: stub a minimal `globalThis.window` (no DOM emulation). Cover `setSession`/`getAccessToken`/`clearSession` round-trip; refresh-token rotation persisted across calls; SSR path (`typeof window === 'undefined'`) returns `null` and never writes; `redirectToLogin` no-ops on `/login`; `refreshSession` returns `false` with no stored token and shares one in-flight promise across concurrent callers; `getErrorMessage` prefers the API `message`. Confirm all fail (module doesn't exist yet). *(Requirement: Session Bootstrap on Page Load, Session Lifetime Tied to Browser/Tab Lifecycle)*
- [x] 2.2 GREEN — Create `apps/admin/src/lib/auth-session.ts`: `SessionUser`/`LoginResponse` types, `REFRESH_KEY`/`USER_KEY` constants. **[non-obvious]** `holder()` returns `window.__erpAuth ??= { token: null }` — a lazy window-scoped holder, not a module-level `let`, so SSR of a client component never shares token state across users. **[non-obvious]** `authClient = axios.create()` with **no interceptors**, kept separate from `lib/axios.ts`'s `api` instance — avoids the `axios.ts` ⇄ `auth-session.ts` import cycle and stops a 401 from `/auth/refresh` re-entering the 401 handler. `getAccessToken`/`getUser`/`setSession`/`clearSession`; `login()` posting via `authClient` then `setSession`; `refreshSession()` posting to `/auth/refresh` via `authClient` with in-flight promise memoization — **[non-obvious]** it must `setSession(res)` with the FULL rotated response (new access token AND new refresh token), not just the access token, because the backend rotates the refresh token on every call; `redirectToLogin()`; `getErrorMessage()`. Confirm 2.1 tests pass. *(Requirement: Successful Login Session Establishment, Session Bootstrap on Page Load, Session Lifetime Tied to Browser/Tab Lifecycle)*
- [x] 2.3 REFACTOR — Run `cd apps/admin && npx vitest run src/lib/auth-session.test.ts`; confirm all cases green, clean up duplication.

## Phase 3: Axios Interceptors — TDD

- [x] 3.1 RED — Create `apps/admin/src/lib/axios.test.ts`: invoke the interceptor handlers directly off `api.interceptors` (no live HTTP call). Cover request interceptor attaching `Authorization: Bearer <token>` only when `getAccessToken()` returns one; response interceptor calling `clearSession()` + `redirectToLogin()` on a 401 and passing other statuses/errors through unchanged. Confirm fail. *(Requirement: Authenticated API Requests, 401 Response Handling)*
- [x] 3.2 GREEN — Modify `apps/admin/src/lib/axios.ts`: import `apiBaseUrl` from `lib/api-base-url.ts` (drop the local duplicate); add the request interceptor and the response interceptor (`error.response?.status === 401` → `clearSession()` + `redirectToLogin()`). **[non-obvious]** `redirectToLogin()` performs a hard `window.location.replace('/login')` — never `router.push`/`router.replace` — so a stale still-`authenticated` React tree elsewhere in the app can't bounce the redirect back. Keep `withCredentials: true` unchanged. Confirm 3.1 tests pass.
- [x] 3.3 REFACTOR — Run `cd apps/admin && npx vitest run src/lib`; confirm the full `auth-session` + `axios` suite passes together.

## Phase 4: `AppShell` — Bootstrap & Route Gate

- [x] 4.1 Create `apps/admin/src/components/organisms/AppShell/AppShell.tsx` (`'use client'`): `status` state (`'loading'|'anonymous'|'authenticated'`) initialized to `'loading'` on **both** server and client (no `sessionStorage` read inside the `useState` initializer — would desync hydration); a mount `useEffect` calls `refreshSession()` to resolve it. Render matrix by `status` × `usePathname()`: `loading` → loader only; `anonymous` on `/login` → `children`; `anonymous` elsewhere → loader + effect `router.replace('/login')`; `authenticated` on `/login` → loader + effect `router.replace('/')`; `authenticated` elsewhere → `Sidebar` + `TopBar` + `children`. These two corrective redirects use in-tree `router.replace` (status is already correct, soft nav is safe) — distinct from the hard `window.location.replace` used for login/logout/401. *(Requirement: Session Bootstrap on Page Load, Route Gating)*
- [x] 4.2 Create `apps/admin/src/components/organisms/AppShell/AppShell.module.css`: full-screen loader class, plus `.appContainer`/`.mainContent`/`.pageContent` moved here from `layout.module.css`.
- [x] 4.3 Modify `apps/admin/src/app/layout.tsx`: keep it a Server Component (`metadata` stays); replace the body's direct `<Sidebar />`/`<TopBar />` render with `<AppShell>{children}</AppShell>`.
- [x] 4.4 Modify `apps/admin/src/app/layout.module.css`: remove `.appContainer`/`.mainContent`/`.pageContent`, now owned by `AppShell.module.css` (4.2).

## Phase 5: Login Page

- [x] 5.1 Create `apps/admin/src/app/login/page.tsx` (`'use client'`): controlled `email`/`password`, `submitting`/`error: string|null` state; submit → `login(email, password)` → **[non-obvious]** `window.location.replace('/')` (hard nav, not `router.push`) so `AppShell` re-bootstraps from a clean React tree; on failure `setError(getErrorMessage(e, 'No pudimos iniciar sesión. Intentá de nuevo.'))` rendered in a `role="alert"` region (401/429 messages come verbatim from the API); button disabled while submitting, label `Ingresando…`; `autoComplete="email"`/`"current-password"`; `<Logo />` above the title. *(Requirement: Login Form Submission, Successful Login Session Establishment)*
- [x] 5.2 Create `apps/admin/src/app/login/page.module.css`: centered card, `--color-primary` CTA, Montserrat heading, ERP design tokens (visually inspired by the e-commerce login card).

## Phase 6: Logout Wiring

- [x] 6.1 Modify `apps/admin/src/components/organisms/Sidebar/Sidebar.tsx`: wire the already-imported-but-unused `LogOut` icon (line 6) into a `.footer` button: `onClick={() => { clearSession(); redirectToLogin(); }}`. **[non-obvious]** `redirectToLogin()` performs the hard `window.location.replace('/login')`, not a Next.js router call. *(Requirement: Logout)*
- [x] 6.2 Modify `apps/admin/src/components/organisms/Sidebar/Sidebar.module.css`: add `.logoutBtn`, mirroring `.navLink`.

## Phase 7: Verification

- [x] 7.1 Run `cd apps/admin && npx vitest run`; confirm `auth-session.test.ts` and `axios.test.ts` pass with zero failures.
- [x] 7.2 Run `cd apps/admin && npx tsc --noEmit`; confirm zero type errors across all new/modified files.
- [x] 7.3 Manual QA against `pnpm dev` (api `:3001`, admin `:3002`, seed creds `admin@entregas.com.bo` / `temporal123`): valid login → dashboard; invalid → error shown, no redirect; reload keeps session; protected route with no/expired session → `/login`; logout → `/login`, back-button doesn't restore chrome; browser close ends session; `/login` while authenticated → `/`; all nav routes still render `Sidebar`/`TopBar`.
- [x] 7.4 Verify `CORS_ORIGINS` (or `DEV_DEFAULT_ORIGINS`) includes the admin origin before merge, per design's Migration/Rollout note.
