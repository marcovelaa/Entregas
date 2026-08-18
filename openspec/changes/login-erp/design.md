# Design: ERP Login for `apps/admin`

## Technical Approach

Client-only bearer-token session (proposal Approach 2). A new `auth-session.ts`
owns the token pair; `axios.ts` interceptors consume it; a single client
organism `AppShell` owns bootstrap, route gating and chrome. **Every auth-state
transition (login success, logout, 401) is a full-page `window.location.replace`**,
so `AppShell`'s boot-time refresh is the *only* place session status is
established. Zero backend changes.

## Architecture Decisions

| # | Decision | Choice | Rejected alternative | Rationale |
|---|---|---|---|---|
| 1 | Access-token home | `window.__erpAuth.token` holder, lazily created | module-level `let` | A module `let` also exists during SSR of client components — one Node process would share it across users. Window-scoping makes the server path structurally unreachable, and it survives HMR module re-eval in dev. |
| 2 | Auth HTTP client | `authClient` = bare `axios.create()` in `auth-session.ts`, **no interceptors** | reuse the shared `api` instance | Kills two problems at once: no `axios.ts` ⇄ `auth-session.ts` import cycle, and a 401 from `/auth/refresh` can never re-enter the 401 handler. Loop-proof by construction, not by a retry flag. |
| 3 | Base-URL sharing | extract `lib/api-base-url.ts`, imported by both | duplicate the `process.env` read | Keeps the graph acyclic (`api-base-url` ← `auth-session` ← `axios`) with one source of truth. |
| 4 | 401 policy | clear + redirect, **no refresh-and-retry** | queue-and-replay on 401 | Confirmed scope. Access token lives 8h and is refreshed on load; retry machinery would be the only source of loop risk. |
| 5 | Gate + bootstrap | **one** component (`AppShell`) | separate `AuthProvider` + `AppShell` | Both need the same tri-state and the same "resolving" frame; splitting forces a context purely to share it. |
| 6 | Transitions | hard `window.location.replace` | `router.replace` + context `setStatus` | With soft nav, a still-`authenticated` `AppShell` bounces logout back to `/`, and a still-`anonymous` one bounces post-login back to `/login`. Hard nav wipes React state; bootstrap re-derives truth. Cost: one reload + one `/auth/refresh` per login. |
| 7 | `AppShell` layer | `components/organisms/` | `components/templates/` | Atomic-design would say template, but this repo has no `templates/` layer; follow `Sidebar`/`TopBar`. |

## Data Flow

```
    login page ──POST /auth/login──> authClient (no interceptors)
         │                                  │
         │  setSession(res)  ──> window.__erpAuth.token  +  sessionStorage
         └──> window.location.replace('/')
                     │
    AppShell mount ──┴──> refreshSession() ──POST /auth/refresh──> setSession
                     │                                             (token rotates)
                     └──> status: loading | anonymous | authenticated
                                          │
    any page ──> api ──req int: Bearer──> API ──401──> res int: clearSession
                                                          + replace('/login')
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `apps/admin/src/lib/api-base-url.ts` | Create | `export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "/api";` |
| `apps/admin/src/lib/auth-session.ts` | Create | Token store, `login`, `refreshSession`, `clearSession`, `redirectToLogin`, `getErrorMessage` |
| `apps/admin/src/components/organisms/AppShell/AppShell.tsx` | Create | `'use client'` gate: bootstrap + pathname branch + chrome |
| `apps/admin/src/components/organisms/AppShell/AppShell.module.css` | Create | Full-screen loader; chrome classes move here from `layout.module.css` usage |
| `apps/admin/src/app/login/page.tsx` | Create | `'use client'` form; ERP tokens, no Google/register/forgot |
| `apps/admin/src/app/login/page.module.css` | Create | Centered card, `--color-primary` CTA, Montserrat heading |
| `apps/admin/src/lib/axios.ts` | Modify | Import `apiBaseUrl`; add request + response interceptors |
| `apps/admin/src/app/layout.tsx` | Modify | Stays a Server Component (keeps `metadata`); body becomes `<AppShell>{children}</AppShell>` |
| `apps/admin/src/components/organisms/Sidebar/Sidebar.tsx` | Modify | Wire the already-imported-but-unused `LogOut` icon (line 6) into a footer logout button |
| `apps/admin/src/components/organisms/Sidebar/Sidebar.module.css` | Modify | `.logoutBtn`, mirroring `.navLink` |

## Interfaces / Contracts

```ts
// lib/auth-session.ts
export type SessionUser = { id: string; publicId: string; nombres: string;
  apellidos: string; email: string; rol: string | null };
export type LoginResponse = { access_token: string; refresh_token: string; usuario: SessionUser };

const REFRESH_KEY = 'erp.refresh_token';
const USER_KEY = 'erp.usuario';

function holder(): { token: string | null } | null {
  if (typeof window === 'undefined') return null;          // SSR: no store, no leak
  const w = window as typeof window & { __erpAuth?: { token: string | null } };
  return (w.__erpAuth ??= { token: null });
}

export function getAccessToken(): string | null;
export function getUser(): SessionUser | null;             // sessionStorage-backed
export function setSession(res: LoginResponse): void;      // memory + sessionStorage (refresh token ROTATES)
export function clearSession(): void;                      // holder.token = null + removeItem both keys
export async function login(email: string, password: string): Promise<void>;
export async function refreshSession(): Promise<boolean>;  // false when no/invalid refresh token
export function redirectToLogin(): void;                   // no-op if already on /login
export function getErrorMessage(e: unknown, fallback: string): string;
```

`refreshSession()` memoizes its in-flight promise (module-scoped, cleared on
settle) so React StrictMode's double-invoked effect and any concurrent caller
share one request. `redirectToLogin()` guards on
`window.location.pathname.startsWith('/login')` so N simultaneous 401s cause one
navigation, not a storm.

`POST /api/auth/refresh` returns a *full* login payload — the refresh token
rotates on every call, so `refreshSession` must `setSession(res)`, not just store
the access token.

```ts
// lib/axios.ts — appended
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError) => {
    if (error.response?.status === 401) { clearSession(); redirectToLogin(); }
    return Promise.reject(error);
  },
);
```

`withCredentials: true` stays — inert for this bearer domain, still used by
nothing else; removing it is an unrelated change.

### `AppShell` render matrix

```tsx
const [status, setStatus] = useState<'loading'|'anonymous'|'authenticated'>('loading');
```

Initialise to `'loading'` on **both** server and client — reading
`sessionStorage` in a lazy `useState` initialiser would desync hydration. A
`useEffect` then calls `refreshSession()`, which resolves *synchronously* to
`'anonymous'` when `sessionStorage` has no refresh token, so a first-time
visitor sees at most one loader frame and no network call.

| status | on `/login` | elsewhere |
|---|---|---|
| `loading` | loader, no chrome | loader, no chrome |
| `anonymous` | `children` (login form), no chrome | effect: `router.replace('/login')` + loader |
| `authenticated` | effect: `router.replace('/')` + loader | `Sidebar` + `TopBar` + `children` |

Redirects fire in effects, never during render. `AppShell` uses `router.replace`
(in-tree, state stays coherent); `auth-session.redirectToLogin` uses
`window.location.replace` because it is called from the axios interceptor and
from logout — both outside React, both needing state wiped.

### Login page

Controlled `email` / `password`, `submitting` and `error: string | null`.
Submit → `login(email, password)` → `window.location.replace('/')`. On failure
`setError(getErrorMessage(e, 'No pudimos iniciar sesión. Intentá de nuevo.'))`,
rendered in a `role="alert"` region; the 401 (`Credenciales inválidas`) and 429
throttle messages come straight from the API per confirmed scope. Button
disabled while submitting, label `Ingresando…`. `autoComplete="email"` /
`"current-password"`, `<Logo />` above the card title.

### Logout

`Sidebar` is already `'use client'`; add to `.footer`:
`<button onClick={() => { clearSession(); redirectToLogin(); }}><LogOut size={20}/>…</button>`.

## Testing Strategy

No test runner exists in `apps/admin` (no jest/vitest config, no `test` script),
and `turbo.json` defines no `test` task — `openspec/config.yaml`'s
`npx turbo run test` currently covers `apps/api` only via a task that is not
declared. Add **Vitest, node environment only** (no jsdom, no RTL) plus a `test`
task in `turbo.json`, scoped to `src/lib/*.test.ts`. `auth-session` reads
`sessionStorage`/`window` through `holder()` and a `store()` accessor, so tests
stub a minimal `globalThis.window` object — no DOM emulation needed.

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `setSession`/`getAccessToken`/`clearSession` round-trip; refresh-token rotation persisted; server path (`typeof window === 'undefined'`) returns `null` and never writes; `redirectToLogin` no-ops on `/login`; `refreshSession` returns `false` with no stored token and shares one in-flight promise; `getErrorMessage` prefers the API `message` | Vitest, stubbed `window`/`sessionStorage` |
| Unit | Request interceptor attaches `Bearer` only when a token exists; response interceptor calls `clearSession` on 401 and passes other statuses through | Vitest, invoke the interceptor handlers directly off `api.interceptors` |
| Integration | None automated | Component/route rendering is not covered; adding RTL is out of scope |
| Manual QA | Valid login → dashboard; invalid → error, no redirect; reload keeps session; expired/absent token on a protected route → `/login`; logout → `/login` and back-button does not restore chrome; browser close ends session; `/login` while authenticated → `/`; all nav routes still render chrome | Browser against `pnpm dev` (api :3001, admin :3002), seed creds `admin@entregas.com.bo` / `temporal123` |

## Threat Matrix

N/A — no routing-dispatch, shell, subprocess, VCS/PR automation,
executable-file classification, or process-integration boundary. The change is
client-side navigation and HTTP headers only.

## Migration / Rollout

No migration, no schema change, no feature flag. Ship in one PR (forecast well
under the 400-line budget). Verify `CORS_ORIGINS` (or `DEV_DEFAULT_ORIGINS`)
includes the admin origin before merge — the `Authorization` header is only
newly-required on preflight; Nest reflects `Access-Control-Request-Headers` by
default, so no API change is expected.

## Rollback

Revert the `apps/admin` commit. Six new files disappear; four modified files
have clean boundaries — `axios.ts` (two appended `interceptors.use` blocks + one
import swap), `layout.tsx` (one JSX subtree swap), `Sidebar.tsx`/`.module.css`
(one footer button). No data, backend, or config state to undo.

## Open Questions

- [ ] Adding Vitest + a `turbo.json` `test` task is a small scope addition beyond
      the proposal's file list — confirm before `sdd-tasks`, or drop to manual QA only.
- [ ] `TopBar` shows a hardcoded `Admin` / `Administrador`; `getUser()` makes the
      real name available. Wire it here or as a follow-up?
- [ ] The 429 throttle body surfaces an English framework message; confirmed
      scope says display server messages verbatim — accept as-is?
