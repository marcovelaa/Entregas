# ERP Responsive + Architecture Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every ERP module (`apps/admin`) work correctly on mobile (~375px) through desktop, bring each module's frontend in line with the atomic-design/container-presentational conventions already established in this codebase, and verify (fixing where wrong) that each module actually talks to the real, currently-live backend.

**Architecture:** Task 0 replaces the JS-`resize`-driven sidebar collapse with a proper CSS-media-query-driven mobile drawer, owned by a new `AppShell` container component that also fixes the SSR-flash bug (the sidebar width is now set via a React inline style during render, not via a `useEffect` after mount). Tasks 1-10 apply the same standard to each of the 10 ERP modules in increasing order of size/risk, each task auditing and fixing responsive layout, component architecture, and backend connectivity together.

**Tech Stack:** Next.js 16 (App Router, CSS Modules — no Tailwind), React 19, `lucide-react` icons, `axios` (`apps/admin/src/lib/axios.ts`), NestJS backend at `http://localhost:3001/api`.

## Global Constraints

- **Design doc:** `docs/superpowers/specs/2026-08-14-erp-responsive-architecture-design.md` is the source of truth for product decisions (breakpoints, module order, patterns, checklist). Do not re-litigate scope there.
- **Next.js 16 warning:** `apps/admin/AGENTS.md` states this Next.js build has breaking changes vs. training data, specifically around routing/middleware/data APIs. Before using any Next.js-specific API you're not 100% sure about (not plain React `useState`/CSS), check `apps/admin/node_modules/next/dist/docs/`. Plain CSS Modules and React component code are low-risk and don't need this check.
- **Read before you edit.** Every task below modifies files whose current content this plan does not reproduce in full (only relevant excerpts/line numbers are given, captured before this plan was written — they may have shifted slightly). Read the current file before editing it.
- **No test runner exists for `apps/admin`.** Verification is: `cd apps/admin && npx tsc --noEmit` (must stay clean), a production build (`npx next build` — cheaper than running the dev server for a compile-correctness check, though manual viewport verification still needs the dev server), and manual viewport verification at 3 widths using the dev server already running on `:3002` (or restart it if it's down: `cd apps/admin && npm run dev`, from repo root `/Users/axb/Entregas`).
- **Viewport verification protocol** (every task): using a browser (or `chromium-cli`/Playwright if available in this environment), load the module's main page at three widths — **375px** (mobile), **820px** (tablet), **1280px** (desktop) — and confirm no horizontal scrollbar, no overlapping/clipped content, and (once Task 0 lands) the sidebar behaves as a drawer below 768px and as a fixed rail above it.
- **Backend ground truth:** the live route list was captured directly from a running `nest start --watch` process on 2026-08-14 (not from reading source — this is what's actually mapped). Route prefix is `/api` (axios `baseURL` already includes it, so admin code calls e.g. `api.get('/proveedores')` for the live route `GET /api/proveedores`). Per-module live routes are listed in each task below. If a task's module calls a route not in this list, or the list has a route the module never calls that a reasonable ERP screen should expose, that's a connectivity finding to fix or explicitly note.
- **Money/business logic changes are out of scope.** These tasks touch layout, component structure, and wiring existing UI to existing endpoints — not new business rules.
- **Orphaned components:** while reading any file in any task, if you notice a shared component that's imported nowhere except its own file (the design doc's brainstorming phase already found `molecules/SlideOver` in this state), note it in your task report. Don't delete it as a side effect of an unrelated task unless removing it is trivially safe and directly touches a file you're already editing for another reason.
- **Discovery, not in scope for this plan:** `Pedidos` (`GET/PATCH /api/pedidos...`), `Devoluciones` (`GET/PATCH /api/devoluciones...`), and `Bitácora` (`GET /api/bitacora`) all have complete backend support but **zero ERP UI or sidebar entry**. This plan does not add those screens — flag it to the user as a separate, future scope decision, don't build it as a side effect of any task below.

### Shared responsive patterns (reference — copy these exactly, don't re-derive per module)

**Breakpoints** (literal values, no CSS var — plain CSS Modules can't use `var()` inside `@media`):
```css
/* tablet */
@media (max-width: 1024px) { }
/* mobile/tablet chico */
@media (max-width: 768px) { }
/* mobile chico */
@media (max-width: 480px) { }
```

**Table → stacked cards below 768px.** For any module with a data table (`proveedores`, `inventario`, `ventas`, `clientes`, `compras`, `catalogo/productos`), apply this pattern to its CSS module. Assume the existing table markup is a plain `<table>` with a `.table` class wrapping `<thead>`/`<tbody>` — adapt selectors to match what you actually find, but the CSS shape below is the required output:

```css
@media (max-width: 768px) {
  .table thead {
    display: none;
  }
  .table, .table tbody, .table tr, .table td {
    display: block;
    width: 100%;
  }
  .table tr {
    margin-bottom: 1rem;
    border: 1px solid var(--border-light);
    border-radius: 8px;
    padding: 0.75rem;
  }
  .table td {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.4rem 0;
    border: none;
    text-align: right;
  }
  .table td::before {
    content: attr(data-label);
    font-weight: 600;
    color: var(--text-muted);
    text-align: left;
  }
}
```
Each `<td>` needs a `data-label="Columna"` attribute added in the JSX matching its header, so the `::before` pseudo-element can show the column name in the stacked mobile view. If the module's table is built with `<div>` grid rows instead of a real `<table>`, adapt the same idea (label + value pairs stacking vertically) to that structure instead of forcing a fake `<table>`.

**Multi-column form → 1 column below 640px.** For any grid-based form layout (commonly `display: grid; grid-template-columns: repeat(N, 1fr);` in the module's CSS):
```css
@media (max-width: 640px) {
  .formGrid {
    grid-template-columns: 1fr;
  }
}
```
(Class name will vary per file — find the actual grid container class and add the override, don't invent a new class name.)

---

## Task 0: Shell — AppShell container, CSS-driven mobile drawer

**Files:**
- Create: `apps/admin/src/components/organisms/AppShell/AppShell.tsx`
- Create: `apps/admin/src/components/organisms/AppShell/AppShell.module.css`
- Modify: `apps/admin/src/app/layout.tsx`
- Delete: `apps/admin/src/app/layout.module.css` (its content moves into `AppShell.module.css`)
- Modify: `apps/admin/src/components/organisms/Sidebar/Sidebar.tsx`
- Modify: `apps/admin/src/components/organisms/Sidebar/Sidebar.module.css`
- Modify: `apps/admin/src/components/organisms/TopBar/TopBar.tsx`
- Modify: `apps/admin/src/components/organisms/TopBar/TopBar.module.css`

**Interfaces:**
- Produces: `AppShell` component (props: `{ children: React.ReactNode }`), used by every later task implicitly (it wraps every page — no later task imports it directly). `Sidebar` now takes props `{ isCollapsed: boolean; onToggleCollapse: () => void; isMobileOpen: boolean; onCloseMobile: () => void }` instead of managing its own state. `TopBar` now takes props `{ onOpenMobileMenu: () => void }`.

**Current state (read before editing):**
- `Sidebar.tsx` currently owns `isCollapsed` state itself, driven by a `window.innerWidth` resize listener (auto-collapses below 768px) and a second `useEffect` that writes the `--current-sidebar-width` CSS custom property to `document.documentElement` — this is the JS-driven, SSR-flash-prone behavior being replaced.
- `layout.tsx` renders `<Sidebar />` and `<TopBar />` directly with no shared state between them.
- `layout.module.css` has `.appContainer`, `.mainContent` (reads `var(--current-sidebar-width, 250px)` for `margin-left`), `.pageContent` (has `@media (max-width: 768px)` and `@media (max-width: 480px)` padding rules already — keep these, add a 1024px tier per the shared breakpoint standard).
- Neither `Sidebar` nor the shell has any mobile drawer/overlay/hamburger today — the sidebar always occupies 60-250px of horizontal space, even at 375px viewport width.

- [ ] **Step 1: Create `AppShell.module.css`**

```css
.appContainer {
  display: flex;
  min-height: 100vh;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  z-index: 45;
}

.mainContent {
  flex: 1;
  margin-left: var(--current-sidebar-width, 250px);
  background-color: var(--bg-color);
  min-height: 100vh;
  transition: margin-left 0.3s ease;
  display: flex;
  flex-direction: column;
}

.pageContent {
  padding: 2rem;
  flex: 1;
}

@media (max-width: 1024px) {
  .pageContent {
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .mainContent {
    margin-left: 0;
  }
  .pageContent {
    padding: 1rem 0.75rem;
  }
}

@media (max-width: 480px) {
  .pageContent {
    padding: 0.75rem 0.5rem;
  }
}
```

- [ ] **Step 2: Create `AppShell.tsx`**

```tsx
'use client';

import React, { useState, type CSSProperties } from 'react';
import { Sidebar } from '../Sidebar/Sidebar';
import { TopBar } from '../TopBar/TopBar';
import styles from './AppShell.module.css';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const sidebarWidthVar = {
    '--current-sidebar-width': isCollapsed ? '80px' : '250px',
  } as CSSProperties;

  return (
    <div className={styles.appContainer} style={sidebarWidthVar}>
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((v) => !v)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />
      {isMobileOpen && (
        <div className={styles.overlay} onClick={() => setIsMobileOpen(false)} />
      )}
      <div className={styles.mainContent}>
        <TopBar onOpenMobileMenu={() => setIsMobileOpen(true)} />
        <div className={styles.pageContent}>{children}</div>
      </div>
    </div>
  );
}
```

Note: setting the CSS custom property via the React `style` prop (not a `useEffect`) means it's part of the very first render on both server and client — no flash, no hydration mismatch, because `isCollapsed` always starts `false` in both environments.

- [ ] **Step 3: Rewrite `Sidebar.tsx`**

Remove both `useEffect` hooks entirely. Accept the four new props. Add a mobile-only close button (`X` icon from `lucide-react`, already a dependency — confirm by checking the existing `lucide-react` imports at the top of the current file). Call `onCloseMobile` when a nav link is clicked (so tapping a link on mobile closes the drawer):

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, Users, Settings, Library, Building2, ChevronLeft, ChevronRight, MonitorSmartphone, Receipt, Tag, X } from 'lucide-react';
import { Logo } from '../../atoms/Logo/Logo';
import styles from './Sidebar.module.css';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/caja', label: 'Caja (POS)', icon: MonitorSmartphone },
  { href: '/ventas', label: 'Ventas', icon: Receipt },
  { href: '/catalogo', label: 'Catálogo', icon: Library },
  { href: '/proveedores', label: 'Proveedores', icon: Building2 },
  { href: '/compras', label: 'Compras', icon: ShoppingCart },
  { href: '/inventario', label: 'Inventario', icon: Package },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/descuentos', label: 'Descuentos', icon: Tag },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ isCollapsed, onToggleCollapse, isMobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''} ${isMobileOpen ? styles.mobileOpen : ''}`}>
      <div className={styles.logoContainer}>
        <Logo isCollapsed={isCollapsed} />
        <button
          className={styles.collapseBtn}
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expandir' : 'Contraer'}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        <button className={styles.closeMobileBtn} onClick={onCloseMobile} aria-label="Cerrar menú">
          <X size={22} />
        </button>
      </div>
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <li key={item.href} className={styles.navItem}>
                <Link
                  href={item.href}
                  className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                  title={isCollapsed ? item.label : undefined}
                  onClick={onCloseMobile}
                >
                  <Icon size={20} className={styles.icon} />
                  {!isCollapsed && <span className={styles.text}>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className={styles.footer}>
        {!isCollapsed ? (
          <p className={styles.footerText}>Admin ERP v1.0</p>
        ) : (
          <p className={styles.footerText}>v1</p>
        )}
      </div>
    </aside>
  );
}
```

- [ ] **Step 4: Add drawer + mobile-close-button CSS to `Sidebar.module.css`**

Keep every existing rule in the file as-is (the `.collapsed` desktop styles are untouched). Add:

```css
.closeMobileBtn {
  display: none;
}

@media (max-width: 768px) {
  .sidebar {
    width: 250px;
    transform: translateX(-100%);
  }
  .sidebar.mobileOpen {
    transform: translateX(0);
  }
  .collapseBtn {
    display: none;
  }
  .closeMobileBtn {
    display: flex;
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    align-items: center;
    justify-content: center;
  }
}
```

Also change the existing `.sidebar` rule's `transition` line from `transition: width 0.3s ease;` to `transition: width 0.3s ease, transform 0.3s ease;` so the drawer slide is animated too.

- [ ] **Step 5: Add hamburger button to `TopBar.tsx`**

```tsx
import React from 'react';
import { Menu } from 'lucide-react';
import { GlobalNotifications } from '../GlobalNotifications/GlobalNotifications';
import styles from './TopBar.module.css';

interface TopBarProps {
  onOpenMobileMenu: () => void;
}

export function TopBar({ onOpenMobileMenu }: TopBarProps) {
  return (
    <div className={styles.topbar}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onOpenMobileMenu} aria-label="Abrir menú">
          <Menu size={22} />
        </button>
      </div>
      <div className={styles.right}>
        <div className={styles.notificationsWrapper}>
          <GlobalNotifications />
        </div>

        <div className={styles.divider}></div>

        <div className={styles.profile}>
          <div className={styles.avatar}>AD</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>Admin</span>
            <span className={styles.userRole}>Administrador</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Add `.menuBtn` CSS to `TopBar.module.css`**

Keep every existing rule. Add:

```css
.menuBtn {
  display: none;
  background: transparent;
  border: none;
  color: var(--text-main);
  cursor: pointer;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
}

@media (max-width: 768px) {
  .menuBtn {
    display: flex;
  }
}
```

- [ ] **Step 7: Update `layout.tsx`, delete `layout.module.css`**

```tsx
import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '../components/organisms/AppShell/AppShell';

export const metadata: Metadata = {
  title: 'Admin ERP - ENTREGAS',
  description: 'Sistema ERP de Entregas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
```

Delete `apps/admin/src/app/layout.module.css` (its rules now live in `AppShell.module.css` from Step 1).

- [ ] **Step 8: Verify**

```bash
cd apps/admin && npx tsc --noEmit
```
Expected: clean.

```bash
cd apps/admin && npx next build
```
Expected: clean production build.

Then, with the dev server running (`cd apps/admin && npm run dev`, or it may already be running on `:3002`), open `http://localhost:3002/` in a browser and verify at the three viewports from Global Constraints:
- **375px:** sidebar is off-screen by default; tapping the hamburger in the top bar slides it in over an overlay; tapping a nav link or the overlay closes it; the page content occupies the full width (no reserved margin).
- **820px / 1280px:** sidebar behaves exactly as before this change — always visible, collapsible via the existing chevron button, no hamburger visible, no overlay.
- No flash of the old (wide) sidebar on initial page load at 375px — reload the page a few times to confirm.

- [ ] **Step 9: Commit**

```bash
git add apps/admin/src/components/organisms/AppShell apps/admin/src/app/layout.tsx apps/admin/src/components/organisms/Sidebar apps/admin/src/components/organisms/TopBar
git rm apps/admin/src/app/layout.module.css
git commit -m "feat(admin): replace JS resize-driven sidebar with CSS mobile drawer via AppShell"
```

---

## Task 1: `proveedores`

**Files:**
- Modify: `apps/admin/src/app/proveedores/page.tsx` (220 lines — no local `page.module.css`; reuses `apps/admin/src/app/catalogo/page.module.css`, per the current import)

**Interfaces:** none consumed from other tasks; Task 0 must be complete first (this page renders inside `AppShell`).

**Backend connectivity — live routes for this module:**
```
GET    /api/proveedores
POST   /api/proveedores
PATCH  /api/proveedores/:id
```
Current calls in `proveedores/page.tsx` (lines 39, 75, 77, 90): `GET /proveedores?limit=100`, `PATCH /proveedores/:id`, `POST /proveedores`, `PATCH /proveedores/:id` (activo toggle). These already match the live routes exactly — no connectivity fix expected here, just confirm during Step 1's read that nothing has silently drifted.

- [ ] **Step 1: Read the current file**

```bash
cd apps/admin && bat src/app/proveedores/page.tsx
```
Confirm the four API calls above still match, and note whether the file already imports `catalogo/page.module.css` or has grown its own module since this plan was written.

- [ ] **Step 2: Apply the table→cards pattern (Global Constraints) to the data table**

Find the table markup and its CSS classes in the shared CSS module this page imports. Add `@media (max-width: 768px)` rules per the shared pattern, and add `data-label` attributes to each `<td>` matching its column header.

- [ ] **Step 3: Architecture check**

This file has no local `components/` folder and reuses another module's CSS file — that's the specific thing to evaluate here: is `catalogo/page.module.css` actually the right file to keep sharing, or has this page grown enough (220 lines, modal forms, table) that it should get its own `proveedores.module.css` alongside a proper `components/` split (e.g. a `ProveedorFormModal` extracted from inline JSX, following the checklist's container/presentational and file-size-trigger criteria)? Use judgment: if the file is still reasonably a thin container plus one form modal, a local CSS module (copy relevant rules out of `catalogo/page.module.css`, don't share cross-module styling) is the minimum fix; only extract a component if the inline modal JSX is large enough to clearly meet the 300-line signal from the design doc.

- [ ] **Step 4: Verify**

```bash
cd apps/admin && npx tsc --noEmit && npx next build
```
Then manual viewport check per Global Constraints at `/proveedores`.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/app/proveedores
git commit -m "feat(admin): make proveedores responsive, own its styles"
```

---

## Task 2: `inventario`

**Files:**
- Modify: `apps/admin/src/app/inventario/page.tsx` (196 lines)
- Modify: `apps/admin/src/app/inventario/page.module.css`

**Backend connectivity — live routes for this module:**
```
GET  /api/inventario/alertas
GET  /api/inventario/stock
GET  /api/inventario/movimientos
POST /api/inventario/movimientos
```
Current calls (lines 24, 27): `GET /inventario/stock`, `GET /inventario/movimientos`. **Two live routes are never called from this page: `GET /inventario/alertas` and `POST /inventario/movimientos`.** Confirm during Step 1 whether this is a real gap (no way to see low-stock alerts or register a manual stock movement from the ERP) or whether those actions live somewhere else you can find by searching the codebase (`rg -n "alertas|movimientos" apps/admin/src/app/inventario`). If it's a genuine gap and small to close (e.g. a read-only alerts panel using the existing `GET /alertas` response shape), wire it in as part of this task's connectivity fix — don't build a large new feature; if closing it would require nontrivial new UI design work, leave it as a noted gap in your task report instead of improvising a design.

- [ ] **Step 1: Read the current file and confirm the connectivity gap**

```bash
cd apps/admin && bat src/app/inventario/page.tsx src/app/inventario/page.module.css
```

- [ ] **Step 2: Apply the table→cards pattern to the stock/movimientos tables**

Per the shared pattern in Global Constraints.

- [ ] **Step 3: Close the connectivity gap if it's genuinely simple** (per the note above), or document why it isn't in your task report.

- [ ] **Step 4: Architecture check** — container/presentational split, extract if the file has grown unwieldy per the 300-line signal.

- [ ] **Step 5: Verify**

```bash
cd apps/admin && npx tsc --noEmit && npx next build
```
Manual viewport check at `/inventario`.

- [ ] **Step 6: Commit**

```bash
git add apps/admin/src/app/inventario
git commit -m "feat(admin): make inventario responsive and close alertas/movimientos gap"
```

---

## Task 3: `ventas`

**Files:**
- Modify: `apps/admin/src/app/ventas/page.tsx` (409 lines)
- Modify: `apps/admin/src/app/ventas/page.module.css`

**Backend connectivity — live routes for this module:**
```
GET  /api/ventas
POST /api/ventas/:id/anular
POST /api/ventas/:id/revertir-anulacion
```
Current calls (lines 21, 53, 72) match all three exactly. No connectivity fix expected — confirm during Step 1.

- [ ] **Step 1: Read the current file**

```bash
cd apps/admin && bat src/app/ventas/page.tsx src/app/ventas/page.module.css
```

- [ ] **Step 2: Apply the table→cards pattern** to the sales list table.

- [ ] **Step 3: Architecture check** — 409 lines with no local `components/` folder is above the 300-line signal from the design doc. Look for a natural extraction: likely candidates are the anulación confirmation modal/dialog and the sale-detail row rendering. Extract what's genuinely reusable or clarifying; don't force a split that doesn't have a clean boundary.

- [ ] **Step 4: Verify**

```bash
cd apps/admin && npx tsc --noEmit && npx next build
```
Manual viewport check at `/ventas`.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/app/ventas
git commit -m "feat(admin): make ventas responsive, extract components over 300-line threshold"
```

---

## Task 4: `clientes`

**Files:**
- Modify: `apps/admin/src/app/clientes/page.tsx` (427 lines)
- Modify: `apps/admin/src/app/clientes/page.module.css`

**Backend connectivity — live routes for this module:**
```
POST /api/clientes
GET  /api/clientes
PUT  /api/clientes/:id
```
Current calls (lines 31, 64, 66, 81) match exactly. No connectivity fix expected — confirm during Step 1.

**Note:** this ERP `clientes` module is the staff-facing customer CRUD (create/edit/list any `Cliente` row, including walk-in/POS customers with no login). It is unrelated to the customer-facing self-service identity system (`/api/clientes/auth/*`, `/api/clientes/me`) that also exists in the backend — don't conflate the two or try to add self-service-account fields (like a password) to this screen; that's explicitly a different, already-built system.

- [ ] **Step 1: Read the current file**

```bash
cd apps/admin && bat src/app/clientes/page.tsx src/app/clientes/page.module.css
```

- [ ] **Step 2: Apply the table→cards pattern** to the customer list table.

- [ ] **Step 3: Architecture check** — 427 lines, above the 300-line signal. Extract the create/edit form modal if it's inline, following the container/presentational split.

- [ ] **Step 4: Verify**

```bash
cd apps/admin && npx tsc --noEmit && npx next build
```
Manual viewport check at `/clientes`.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/app/clientes
git commit -m "feat(admin): make clientes responsive, extract components over 300-line threshold"
```

---

## Task 5: `compras`

**Files:**
- Modify: `apps/admin/src/app/compras/page.tsx` (108 lines)
- Modify: `apps/admin/src/app/compras/nueva/page.tsx`
- Modify: `apps/admin/src/app/compras/components/CompraDetalleModal.tsx`
- Modify: `apps/admin/src/app/compras/page.module.css` and `apps/admin/src/app/compras/nueva/page.module.css`

**Backend connectivity — live routes for this module (the important one):**
```
POST  /api/compras
GET   /api/compras
GET   /api/compras/:id
PATCH /api/compras/:id/recibir
PATCH /api/compras/:id/estado
```
Current calls only use `GET /compras`, `POST /compras`, and `GET /compras/:id` (in `CompraDetalleModal.tsx`). **`PATCH /compras/:id/recibir` and `PATCH /compras/:id/estado` are never called anywhere in this module.** This means the ERP has no way to mark a purchase order as received (partially or fully) or change its status, even though the backend fully implements it (per `ROADMAP_COMPLETAR_PROYECTO.md`'s "Compras y proveedores operables" package — that backend work already shipped, per `git log --oneline -- apps/api/src/modules/compras` showing `6ed5de7 feat(compras): implement purchase orders lifecycle, partial reception, and weighted average cost`). This is the single most important connectivity gap in the whole plan.

- [ ] **Step 1: Read the current files**

```bash
cd apps/admin && bat src/app/compras/page.tsx src/app/compras/nueva/page.tsx src/app/compras/components/CompraDetalleModal.tsx
```
Also read the backend side to understand the exact request/response shape you're wiring against:
```bash
cd apps/api && bat src/modules/compras/infrastructure/controllers/compras.controller.ts src/modules/compras/application/use-cases/recibir-compra.use-case.ts
```

- [ ] **Step 2: Wire "recibir" and "estado" into `CompraDetalleModal.tsx`**

Since `CompraDetalleModal` already fetches `GET /compras/:id` and presumably shows line items, add UI to it (buttons/a small form, matching the modal's existing visual style) that call `api.patch(`/compras/${id}/recibir`, payload)` and `api.patch(`/compras/${id}/estado`, payload)`. Read the controller/use-case from Step 1 to get the exact expected request body shape — do not guess field names. After a successful call, refetch the compra detail (`GET /compras/:id`) so the modal shows the updated state.

- [ ] **Step 3: Apply the table→cards pattern** to the compras list table in `compras/page.tsx`.

- [ ] **Step 4: Apply the multi-column-form→1-column pattern** to `compras/nueva/page.tsx` if its form uses a CSS grid layout.

- [ ] **Step 5: Architecture check** across all three files — is `CompraDetalleModal` (now larger after Step 2) still a clean, single-purpose component, or does the recibir/estado UI deserve its own child component within it?

- [ ] **Step 6: Verify**

```bash
cd apps/api && npx tsc --noEmit  # if you touched the backend to read shapes only, this should already be clean
cd apps/admin && npx tsc --noEmit && npx next build
```
Manual check: with the backend running (`:3001`), open `/compras`, open a compra's detail modal, exercise the new recibir/estado actions against a real (or test) compra and confirm the UI reflects the result. Then the three-viewport responsive check on `/compras` and `/compras/nueva`.

- [ ] **Step 7: Commit**

```bash
git add apps/admin/src/app/compras
git commit -m "feat(admin): wire compras recibir/estado, make compras responsive"
```

---

## Task 6: `dashboard` (root `page.tsx`)

**Files:**
- Modify: `apps/admin/src/app/page.tsx` (290 lines)
- Modify: `apps/admin/src/app/page.module.css`

**Backend connectivity — live routes for this module:**
```
GET /api/dashboard/metrics
```
Current call (line 28) matches exactly. No connectivity fix expected — confirm during Step 1.

- [ ] **Step 1: Read the current file**

```bash
cd apps/admin && bat src/app/page.tsx src/app/page.module.css
```

- [ ] **Step 2: Apply responsive layout** — this page is likely a grid of stat cards/charts rather than a table; if it uses a CSS grid, apply the multi-column→1-column pattern (or a 2-column tablet / 1-column mobile intermediate step if the current grid already has more than 2 columns — use judgment based on what you find, keeping content legible, not literally 1 column if 2 reads better at 768px for short stat cards).

- [ ] **Step 3: Architecture check** — extract if over the 300-line signal and there's a clean boundary (e.g. individual stat-card or chart components).

- [ ] **Step 4: Verify**

```bash
cd apps/admin && npx tsc --noEmit && npx next build
```
Manual viewport check at `/`.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/app/page.tsx apps/admin/src/app/page.module.css
git commit -m "feat(admin): make dashboard responsive"
```

---

## Task 7: `configuracion`

**Files:**
- Modify: `apps/admin/src/app/configuracion/usuarios/page.tsx`
- Modify: `apps/admin/src/app/configuracion/roles/page.tsx`
- Modify: `apps/admin/src/app/configuracion/general/page.tsx` (if it has meaningful content — check during Step 1; the design doc's earlier survey noted `configuracion/page.tsx` itself is redirect-only)
- Modify: `apps/admin/src/app/configuracion/configuracion.module.css` (currently has **zero** `@media` rules)
- Modify: `apps/admin/src/app/configuracion/usuarios/page.module.css`

**Backend connectivity — live routes for this module:**
```
GET    /api/usuarios
POST   /api/usuarios
PATCH  /api/usuarios/:id
DELETE /api/usuarios/:id
GET    /api/roles
POST   /api/roles
PATCH  /api/roles/:id
DELETE /api/roles/:id
GET    /api/roles/:id/permisos
PATCH  /api/roles/:id/permisos
GET    /api/permisos
```
All current calls in `usuarios/page.tsx` and `roles/page.tsx` match live routes exactly. No connectivity fix expected — confirm during Step 1.

- [ ] **Step 1: Read the current files**

```bash
cd apps/admin && bat src/app/configuracion/usuarios/page.tsx src/app/configuracion/roles/page.tsx src/app/configuracion/configuracion.module.css src/app/configuracion/layout.tsx
```

- [ ] **Step 2: Add responsive rules to `configuracion.module.css`** — it has zero `@media` today despite backing the shared tab/layout chrome for this whole section. Apply the breakpoint standard: at minimum, ensure the tab navigation (if horizontal) wraps or scrolls sensibly at 375px instead of overflowing, and any multi-column form sections collapse per the shared pattern.

- [ ] **Step 3: Apply the table→cards pattern** to the `usuarios` and `roles` list tables.

- [ ] **Step 4: Architecture check** — this module already reuses the shared `Header`/`Modal` components (per the earlier survey) rather than writing its own; confirm that's still true and that any new modal/form work in this task also reuses `Modal` rather than duplicating it.

- [ ] **Step 5: Verify**

```bash
cd apps/admin && npx tsc --noEmit && npx next build
```
Manual viewport check at `/configuracion/usuarios` and `/configuracion/roles`.

- [ ] **Step 6: Commit**

```bash
git add apps/admin/src/app/configuracion
git commit -m "feat(admin): make configuracion responsive"
```

---

## Task 8: `descuentos`

**Files:**
- Modify: `apps/admin/src/app/descuentos/page.tsx` (750 lines, currently zero `@media` rules)
- Modify: `apps/admin/src/app/descuentos/page.module.css`
- Modify: `apps/admin/src/app/descuentos/nuevo/page.tsx`, `apps/admin/src/app/descuentos/[id]/page.tsx` (both already thin, delegate to `organisms/DiscountForm`)
- Check: `apps/admin/src/components/organisms/DiscountForm/DiscountForm.module.css` (already has `@media` rules using `min-width` — mobile-first, the one exception in the codebase; verify it still reads correctly at all three viewports, don't rewrite its approach just to match the `max-width` convention used elsewhere)
- Modify (if applicable): `apps/admin/src/app/descuentos/combos/components/ComboEditorForm.tsx` and siblings

**Backend connectivity — live routes for this module:**
```
GET    /api/descuentos
GET    /api/descuentos/:id/analitica
GET    /api/descuentos/:id
POST   /api/descuentos
PATCH  /api/descuentos/:id
PUT    /api/descuentos/:id
DELETE /api/descuentos/:id
POST   /api/descuentos/validar
```
`GET /descuentos/:id/analitica` is never called from any file in this module per the current grep. During Step 1, check whether `CampaignAnalyticsModal`/`ComboAnalyticsModal` (already imported by `descuentos/page.tsx`) call it internally (they weren't included in the earlier grep since it only searched `descuentos/` for direct `api.` calls at the page/component level under that folder — those two organism components live under `components/organisms/` and may call it there). If they don't, note it as a finding; only wire it in if it's a small, obviously-correct addition — otherwise leave it noted, this task's primary job is responsive + architecture, not building new analytics UI.

- [ ] **Step 1: Read the current files**

```bash
cd apps/admin && bat src/app/descuentos/page.tsx src/app/descuentos/page.module.css
grep -rn "analitica" src/components/organisms/CampaignAnalyticsModal src/components/organisms/ComboAnalyticsModal 2>/dev/null
```

- [ ] **Step 2: Apply the table→cards pattern** to `descuentos/page.tsx`'s listing table/cards (confirm during Step 1 whether it's already card-based or a true table — the earlier survey described it as having "tab/grid/card layouts", so adapt the shared pattern's intent — stacking, no horizontal scroll — to whatever structure is actually there).

- [ ] **Step 3: Apply the multi-column-form→1-column pattern** to any grid-based sections in `ComboEditorForm.tsx` if present.

- [ ] **Step 4: Architecture check — this is the task's biggest item.** `descuentos/page.tsx` at 750 lines with zero component extraction is the largest single-file architecture violation outside of `caja`. Per the design doc's checklist: identify the natural sections (likely: the discount list/table, a create/filter toolbar, a details drawer) and extract at least the clearest boundaries into either shared organisms (if reusable) or a module-local `descuentos/components/` folder (matching the pattern `catalogo` and `compras` already use). Don't attempt a full rewrite — extract what has a clean boundary, leave the rest, and note anything you deliberately left inline in your task report.

- [ ] **Step 5: Verify**

```bash
cd apps/admin && npx tsc --noEmit && npx next build
```
Manual viewport check at `/descuentos`, `/descuentos/nuevo`, `/descuentos/combos/nuevo`.

- [ ] **Step 6: Commit**

```bash
git add apps/admin/src/app/descuentos apps/admin/src/components/organisms
git commit -m "feat(admin): make descuentos responsive, extract components from 750-line page"
```

---

## Task 9: `caja` (POS)

**Files:**
- Modify: `apps/admin/src/app/caja/page.tsx` (**1040 lines, the largest file in the repo**)
- Modify: `apps/admin/src/app/caja/page.module.css` (already has the best-developed `@media` rules in the codebase — 1024px and 640px tiers restructuring the split-view; read and extend, don't discard)

**Backend connectivity — live routes for this module:**
```
GET  /api/usuarios
GET  /api/clientes
GET  /api/categorias
GET  /api/productos
POST /api/descuentos/validar
POST /api/ventas
```
Current calls (lines 55, 68, 75, 82, 108, 286) match all six exactly. No connectivity fix expected — confirm during Step 1.

- [ ] **Step 1: Read the current file in full**

```bash
cd apps/admin && bat src/app/caja/page.tsx src/app/caja/page.module.css
```
Pay particular attention to the existing `@media (max-width: 1024px)` and `@media (max-width: 640px)` rules already in `page.module.css` (they restructure `.posContainer` from split-view to stacked, and resize `.productsGrid`) — this is the one module that already partially implements the design doc's intended pattern. Confirm it stacks the product grid above the cart/payment panel, and specifically check whether the payment panel (with the order total) stays visible without excessive scrolling once stacked — the design doc calls for a fixed bottom-sheet-style payment panel on mobile so the total is never scrolled out of view. If the current stacked layout already achieves this, this task's responsive work is mostly about extending coverage to 480px and any gaps found in Step 1; if it doesn't, fix it in Step 2.

- [ ] **Step 2: Fix/extend the mobile payment panel behavior**

If the payment panel isn't already pinned, add (inside the existing `@media (max-width: 640px)` block or a new `@media (max-width: 480px)` block, matching what Step 1 found):

```css
@media (max-width: 640px) {
  .rightPanel {
    position: sticky;
    bottom: 0;
    background: white;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);
    z-index: 10;
  }
}
```
(Class name `.rightPanel` is a guess based on the earlier survey's excerpt — confirm the actual class name for the payment/cart panel in Step 1 and use that.)

- [ ] **Step 3: Architecture check — this is the task's biggest item.** 1040 lines with only `Modal` imported from the shared library, everything else inline: product grid, cart, payment panel, search are all in one file. Per the design doc's checklist, extract into a local `caja/components/` folder (this module currently has none — following the same pattern `catalogo`/`compras`/`descuentos` already use). Natural boundaries to look for: a `ProductGrid` (or `ProductosGrid`) presentational component, a `Cart`/`CarritoPanel` component, a `PaymentPanel`/`PanelCobro` component. Extract at least 2-3 of the clearest boundaries; a full decomposition of every piece isn't required in one task, but leaving it at 1040 lines untouched is not acceptable given this is the flagship example the design doc calls out. Keep `page.tsx` as the container: state, data fetching, and composing the extracted pieces.

- [ ] **Step 4: Verify**

```bash
cd apps/admin && npx tsc --noEmit && npx next build
```
Manual viewport check at `/caja` — this is the highest-traffic ERP screen per the user, so verify carefully at 375px: search/browse products, add to cart, and confirm the total is visible/reachable without losing context while scrolling the product grid.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/app/caja
git commit -m "feat(admin): extract caja components, fix mobile payment panel"
```

---

## Task 10: `catalogo`

**Files:**
- Modify: `apps/admin/src/app/catalogo/page.tsx`
- Modify: `apps/admin/src/app/catalogo/page.module.css` (currently zero `@media` rules)
- Modify: `apps/admin/src/app/catalogo/productos/[id]/page.tsx`, `apps/admin/src/app/catalogo/productos/nuevo/page.tsx`
- Modify: `apps/admin/src/app/catalogo/productos/productos.module.css` (currently zero `@media` rules)
- Check: the 6+6 already-existing local components under `catalogo/components/` and `catalogo/productos/components/` — this module already follows the container/presentational + local-components pattern reasonably well; the job here is mostly responsive, not architecture extraction, unless Step 1 finds otherwise.

**Backend connectivity — live routes for this module:**
```
GET    /api/marcas          POST /api/marcas          PATCH /api/marcas/:id
GET    /api/categorias      POST /api/categorias       PATCH /api/categorias/:id
GET    /api/productos       POST /api/productos        PATCH /api/productos/:id
GET    /api/productos/:id/analitica
GET    /api/productos/:publicId  ← note: route param is named :publicId, not :id
POST   /api/variantes       POST /api/variantes/bulk   PATCH /api/variantes/:id
GET    /api/variantes/producto/:productoId
POST   /api/producto-imagenes  POST /api/producto-imagenes/upload/:producto_id
PATCH  /api/producto-imagenes/:id   DELETE /api/producto-imagenes/:id
GET    /api/empaques/variante/:id   POST /api/empaques/bulk   PATCH /api/empaques/:id
```
**Verify one specific thing during Step 1:** `catalogo/productos/[id]/page.tsx` calls `api.get(`/productos/${id}`)` where `id` comes from the Next.js route segment `[id]`. The live backend route for fetching a single product by its public identifier is `GET /api/productos/:publicId` (the plain `:id` PATCH/DELETE routes exist too, but there is no plain `GET /api/productos/:id`). Confirm whether the value flowing into that route param actually is the product's `publicId` (e.g. check how the link to this page is constructed elsewhere, such as in `catalogo/page.tsx`'s row-click handler) — if it's really passing the numeric/internal `id` instead of `publicId`, that GET call is broken today and needs fixing as this task's connectivity fix. If it's already passing `publicId` under a route param that's merely *named* `id` for URL-readability, no fix is needed — just note that you confirmed it.

- [ ] **Step 1: Read the current files and confirm the publicId question above**

```bash
cd apps/admin && bat src/app/catalogo/page.tsx src/app/catalogo/productos/\[id\]/page.tsx
grep -n "productos/" src/app/catalogo/page.tsx src/app/catalogo/components/*.tsx
```

- [ ] **Step 2: Fix the `:publicId` connectivity issue if Step 1 confirms it's broken.**

- [ ] **Step 3: Apply the table→cards pattern** to `catalogo/page.tsx`'s product listing.

- [ ] **Step 4: Apply the multi-column-form→1-column pattern** to the product wizard/editor forms (`ProductWizard.tsx`, `ProductEditor.tsx`, `InfoGeneralSection.tsx`, `VariantesSection.tsx`, `AtributosSection.tsx`, `EmpaquesSection.tsx`, `MediaSection.tsx`, `ComboRecipeSection.tsx` — check each for grid-based layout; only edit the ones that have one).

- [ ] **Step 5: Architecture check** — this module is the largest (21 files) and already reasonably decomposed; confirm no single file has silently grown past the 300-line signal without a matching extraction, and that `MarcasController`-facing UI (`MarcasPanel.tsx`) still reuses `Modal` rather than a bespoke dialog.

- [ ] **Step 6: Verify**

```bash
cd apps/admin && npx tsc --noEmit && npx next build
```
Manual viewport check at `/catalogo`, `/catalogo/productos/nuevo`, and an existing product's edit page.

- [ ] **Step 7: Commit**

```bash
git add apps/admin/src/app/catalogo
git commit -m "feat(admin): make catalogo responsive, fix productos publicId lookup if broken"
```

---

## Task 11: Full regression pass and design-doc closure

**Files:**
- Modify: `docs/superpowers/specs/2026-08-14-erp-responsive-architecture-design.md` (append a closure note, same convention as `ROADMAP_COMPLETAR_PROYECTO.md`'s per-package "Cierre de X" paragraphs)

- [ ] **Step 1: Full verification**

```bash
cd apps/admin && npx tsc --noEmit && npx next build
cd apps/api && npx tsc --noEmit
```
Both must be clean (the api check confirms Task 5's read-only backend inspection didn't accidentally leave an edit).

- [ ] **Step 2: Re-verify all 11 surfaces at the three viewports** (375/820/1280): `/`, `/caja`, `/ventas`, `/catalogo`, `/proveedores`, `/compras`, `/inventario`, `/clientes`, `/descuentos`, `/configuracion/usuarios`, `/configuracion/roles` — confirm the sidebar drawer from Task 0 works correctly from every one of them (not just the ones it was built against), since navigating between modules is the main way a user actually encounters it.

- [ ] **Step 3: Append a closure section to the design doc**

State what shipped (shell + 10 modules), the two real connectivity fixes found and fixed (compras recibir/estado in Task 5, and the catalogo `:publicId` question resolved in Task 10 — state whether it was actually broken or already correct), and flag the out-of-scope discovery from Global Constraints (Pedidos/Devoluciones/Bitácora have no ERP UI) as a recommended follow-up package for the user to prioritize separately.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-08-14-erp-responsive-architecture-design.md
git commit -m "docs(spec): close ERP responsive + architecture review pass"
```
