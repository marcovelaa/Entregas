# Architectural Design: Redesign Discounts UI & Dedicated Editor

## 1. Component & Route Architecture

```
apps/admin/src/app/descuentos/
├── page.tsx                       # Main High-Density Executive Dashboard
├── nuevo/
│   └── page.tsx                   # Dedicated Full-Screen Creator
└── [id]/
    └── page.tsx                   # Dedicated Full-Screen Editor
```

### Shared UI Components:
- `DiscountSummaryCards`: Top executive metric cards (Active Promos, Redeemed Coupons, Total Savings).
- `DiscountEditorLayout`: 2-Column layout:
  - Left (65%): Form section cards (`InfoGeneralCard`, `BeneficioCard`, `TargetSelectorCard`, `ReglasVigenciaCard`).
  - Right (35%): `LivePromoSimulatorCard` (Simulates cart item discount calculation on the fly).

## 2. Target Selector Design
Instead of vertical list of checkboxes inside a modal:
- Tabs: `Categorías`, `Productos`, `Variantes`, `Empaques`.
- Search filter bar per tab.
- Selected items rendered as dismissible pill badges with counters.

## 3. Live Promo Simulator Component (`LivePromoSimulatorCard`)
- React component that watches form state (`tipo`, `valor`, `maxMontoDescuento`, `cantidadRequerida`, `cantidadPaga`).
- Renders an interactive test cart item to simulate how much money is saved and how the promo badge will appear in POS / E-Commerce.
