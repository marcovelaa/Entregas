# Change Proposal: High-Density Discounts Dashboard & Dedicated Full-Screen Editor

## 1. Context & Motivation
The current discount administration interface in `apps/admin/src/app/descuentos/page.tsx` uses a modal overlay for creating and editing discounts. As discounts now support granular targets (Variants, Empaques, Categories), channels (POS, E-Commerce, All), percentage caps, and usage limits, the modal overlay has become cramped and error-prone.

## 2. Objectives
- Transform `/descuentos` into a high-density executive dashboard with key metrics (Total Saved, Active Promos, Coupon Redemptions), tabbed status filters (All, Active, Scheduled, Expired), and quick status toggles.
- Move promotion creation and editing to dedicated full-screen routes:
  - `/descuentos/nuevo`: Dedicated creation workspace.
  - `/descuentos/[id]`: Dedicated editing workspace.
- Implement a 2-column layout in the dedicated editor:
  - **Left Column**: Form cards grouped by Identity/Channel, Benefit Strategy, Target Selector (Categories/Products/Variants/Empaques), and Restrictions/Schedule.
  - **Right Column**: Live Promo Simulator showing real-time POS & E-Commerce badge previews and simulated cart calculation before saving.

## 3. Impacted Files
- `apps/admin/src/app/descuentos/page.tsx` (Main Dashboard)
- `apps/admin/src/app/descuentos/nuevo/page.tsx` (Creation Editor)
- `apps/admin/src/app/descuentos/[id]/page.tsx` (Editing Editor)
- `apps/admin/src/components/organisms/DiscountForm/` (Shared Form & Live Preview components)
