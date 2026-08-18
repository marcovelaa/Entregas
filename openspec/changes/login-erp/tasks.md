# Tasks: ERP Login for `apps/admin`de
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
