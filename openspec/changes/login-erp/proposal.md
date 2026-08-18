# Proposal: ERP Login for `apps/admin`

## Intent

`apps/admin` has no login page or session handling — not a "polish" job as
originally assumed. Verified: no `/login` route, no middleware, `layout.tsx`
renders `Sidebar`/`TopBar` on every route unconditionally, and `axios.ts`
has no token storage or attachment logic. Result: every protected API call
401s silently (bare `try/catch`), with no redirect anywhere. The `iam/auth`
backend (`POST /api/auth/login`, `POST /api/auth/refresh`) is functional and
live-verified this session — the gap is entirely client-side. This builds
the first working ERP login end to end, visually inspired by the
e-commerce login's card layout but using the ERP's own design tokens.

## Scope

### In Scope
- New `/login` route (`apps/admin/src/app/login/page.tsx` + CSS module)
  using ERP tokens (`--color-primary: #2BBCEE`, Montserrat/Hanken Grotesk)
- `access_token` held in memory only; `refresh_token` in `sessionStorage`
- On load, a silent `POST /api/auth/refresh` re-establishes `access_token`
  before rendering protected content
- Axios request interceptor attaching `Authorization: Bearer <token>`
- Axios response interceptor: 401 → clear session, redirect to `/login`
- `layout.tsx` gated: `/login` renders chrome-free; other routes redirect
  to `/login` when there is no session

### Out of Scope
- Any change to `apps/api/src/modules/iam/auth/` — backend already works
- Cookie-based sessions (exploration's Approach 1)
- `apps/frontend`'s own login (separate app, tracked separately)
- Server-side refresh-token revocation / "logout everywhere"
- Idle-timeout, remember-me, role-based redirect — see assumptions below

## Capabilities

### New Capabilities
- `admin-auth`: login, session persistence, and route protection for the
  ERP admin app

### Modified Capabilities
None

## Approach

New `apps/admin/src/lib/auth-session.ts` owns the in-memory access token
plus the `sessionStorage` refresh token. Axios interceptors read/write it.
`Sidebar`/`TopBar` move into a small client wrapper reading `usePathname()`
to exclude `/login` and redirect when unauthenticated. Zero backend
changes — both endpoints already support this and were live-verified.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/admin/src/app/login/page.tsx` | New | Login form |
| `apps/admin/src/app/login/page.module.css` | New | Styling |
| `apps/admin/src/lib/auth-session.ts` | New | Token store |
| `apps/admin/src/lib/axios.ts` | Modified | Interceptors |
| `apps/admin/src/app/layout.tsx` | Modified | Chrome/auth gate |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `sessionStorage` refresh_token is JS-reachable (XSS) | Low-Med | Access token in-memory only; cookie approach flagged as future hardening |
| Browser close fully ends session | Med | Flagged for product confirmation below |
| Layout auth-gate regresses existing routes | Low | Manual smoke test of all nav routes pre-merge |

## Rollback Plan

All changes are new files plus two isolated edits (`axios.ts`,
`layout.tsx`), no schema or backend changes. Revert the `apps/admin`
commit(s) to restore the prior state; nothing to undo in data.

## Dependencies

None — backend endpoints already exist and are verified live.

## Success Criteria

- [ ] Valid credentials land the operator on the dashboard, authenticated
- [ ] Invalid credentials show a clear error, no redirect
- [ ] Page reload keeps the session alive via silent refresh
- [ ] Any 401 clears session and redirects to `/login`
- [ ] Visiting a protected route with no session redirects to `/login`

## Open Questions (pending product confirmation)

See "Proposal question round" in the phase result. Assumptions used to
unblock this proposal: no idle timeout beyond natural token expiry, no
cross-tab session sync, single dashboard destination for all roles, no
extra lockout UI beyond existing server throttling, browser-close ends
the session (no remember-me).
