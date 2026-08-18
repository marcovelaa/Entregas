# Admin Auth Specification

## Purpose

Authentication and client-side session management for the ERP admin app
(`apps/admin`): a login form backed by the existing `iam/auth` endpoints,
bearer-token session handling, and route protection. No capability in
`openspec/specs/` currently covers ERP authentication — `apps/admin` has
no login page or session logic today.

## Requirements

### Requirement: Login Form Submission

The system MUST render a login form at `/login` with `email` and
`password` fields, and MUST submit credentials to `POST /api/auth/login`.
The system MUST show a loading state while the request is in flight and
MUST display the backend's returned error message — including the
message from a 429 throttling response — when the request fails, without
navigating away from `/login`.

#### Scenario: Submission shows a loading state

- GIVEN the operator has entered email and password
- WHEN they submit the login form
- THEN the system shows a loading state until the response arrives

#### Scenario: Failed login surfaces the backend message

- GIVEN the login request fails (invalid credentials or 429 throttling)
- WHEN the response returns
- THEN the system displays the backend's error message
- AND the operator remains on `/login`

### Requirement: Successful Login Session Establishment

On a successful `POST /api/auth/login` response, the system MUST hold the
returned `access_token` in memory only (never in `localStorage`,
`sessionStorage`, or a cookie) and MUST store the returned `refresh_token`
in `sessionStorage`. The system MUST then redirect the operator to the
single dashboard route.

#### Scenario: Valid credentials establish a session

- GIVEN valid credentials are submitted
- WHEN the backend responds with `access_token` and `refresh_token`
- THEN the system stores `access_token` in memory and `refresh_token` in
  `sessionStorage`
- AND redirects to the dashboard

### Requirement: Session Bootstrap on Page Load

On every page load or full-page refresh, if a `refresh_token` is present
in `sessionStorage`, the system MUST silently call `POST /api/auth/refresh`
to obtain a new `access_token` before rendering any protected content. If
the refresh call fails, the system MUST treat the operator as logged out.

#### Scenario: Refresh succeeds on reload

- GIVEN a `refresh_token` exists in `sessionStorage`
- WHEN the page loads or is refreshed
- THEN the system silently obtains a new `access_token`
- AND renders the requested protected route

#### Scenario: Refresh fails on reload

- GIVEN a `refresh_token` exists in `sessionStorage` but the refresh call fails
- WHEN the page loads or is refreshed
- THEN the system treats the operator as logged out

### Requirement: Authenticated API Requests

Every outgoing request issued through `apps/admin`'s shared axios client
MUST carry an `Authorization: Bearer <access_token>` header whenever an
active session exists.

#### Scenario: Session present

- GIVEN an in-memory `access_token` exists
- WHEN any API request is issued
- THEN the request includes `Authorization: Bearer <access_token>`

### Requirement: 401 Response Handling

Any API response with HTTP status 401 MUST cause the system to clear the
current session (in-memory `access_token` and the `sessionStorage`
`refresh_token`) and redirect the operator to `/login`.

#### Scenario: 401 clears the session

- GIVEN an active session
- WHEN any API response returns 401
- THEN the system clears the in-memory token and `sessionStorage`
- AND redirects to `/login`

### Requirement: Route Gating

The `/login` route MUST render without the `Sidebar` and `TopBar` chrome.
Every other route MUST redirect to `/login` when there is no valid
session.

#### Scenario: Login route is chrome-free

- GIVEN the operator navigates to `/login`
- WHEN the page renders
- THEN neither `Sidebar` nor `TopBar` is displayed

#### Scenario: Protected route without a session redirects

- GIVEN there is no valid session
- WHEN the operator navigates to any route other than `/login`
- THEN the system redirects to `/login`

### Requirement: Logout

The system MUST provide an explicit logout action that clears the session
(in-memory `access_token` and `sessionStorage` `refresh_token`) and
redirects to `/login`.

#### Scenario: Logout clears the session

- GIVEN an active session
- WHEN the operator triggers logout
- THEN the system clears the in-memory token and `sessionStorage`
- AND redirects to `/login`

### Requirement: Session Lifetime Tied to Browser/Tab Lifecycle

Because the `refresh_token` lives in `sessionStorage`, the system MUST end
the session when the browser or tab is closed. No session data MUST
survive a full browser/tab close, and the next visit MUST require a fresh
login.

#### Scenario: Closing the browser ends the session

- GIVEN an active session in one browser tab
- WHEN the operator closes that browser or tab and reopens the app
- THEN no `refresh_token` is found in `sessionStorage`
- AND the operator is required to log in again
