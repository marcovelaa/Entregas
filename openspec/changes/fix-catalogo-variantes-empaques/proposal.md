# Proposal: Fix Catálogo Variantes/Empaques Model Integrity

## Intent

An audit of Producto → Variante → Empaque → Imagen (school supplies) against a competitor reference (variant=image axis, packaging=price axis, orthogonal) confirmed the schema axis placement is correct, but found six integrity/UX gaps not covered by `fix-catalog-robustness` (serialization/validation) or `clone-empaques` (packaging cloning). Most urgent: storefront listing pages show `precio_base` while checkout uses `empaque.precio` — customers can see one price and pay another.

## Scope

### In Scope
**Phase 1 — Data & customer-facing integrity**
- Reconcile `Variante.imagen_url` with the `ProductoImagen` gallery as a live reference instead of a one-time copy (finding #1).
- Stop auto-creating a phantom "Estándar" `Variante` for products with no real variation (finding #2); existing rows are flagged, not silently migrated.
- Make listing pages (`ProductCard`, `material-escolar`) and the detail page resolve price from one consistent source (finding #5, highest priority).
- Add structured `varianteId`/`empaqueId` fields to `CartItem` instead of a concatenated string id (finding #6).

**Phase 2 — Terminology & dead code**
- Resolve the dead `opciones_variantes`/`combinacion_opciones` JSON fields and the unreachable attribute-based selector (finding #3) — either activate or remove, not leave silently unused.
- Rename the admin "Variantes / Presentaciones" tab to reflect Variante and Empaque as distinct layers (finding #4).

### Out of Scope
- Anything already delivered by `fix-catalog-robustness` or `clone-empaques`.
- Rewriting the historical `catalogo-inventario` proposal text (source of the "variante = presentación y empaque" phrasing).
- Correcting `openspec/specs/catalogo-gestion/spec.md` terminology and its `@@unique([variante_id, nombre])` documentation — flagged here, actual correction deferred to the spec phase.
- `Empaque` having no image field — confirmed correct, matches the reference model, not a bug.

## Capabilities

### New Capabilities
- `tienda-precio-carrito`: storefront price-source-of-truth and cart line-item traceability rules — currently ungoverned by any spec.

### Modified Capabilities
- `catalogo-gestion`: Variante as documented intermediate layer, image ownership model, phantom-variant creation rule, dead-field resolution.

## Approach

Ship Phase 1 first (customer-facing correctness, no schema migration required — reuses existing `Variante.imagen_url`/`ProductoImagen`/`CartItem` structures). Phase 2 needs a product decision (keep the attribute selector as a future differentiator vs. delete dead code) before implementation.

## Affected Areas

| Area | Impact | Description |
|------|--------|--------------|
| `apps/api/.../prisma-producto.repository.ts` | Modified | Stop phantom "Estándar" variant creation |
| `apps/frontend/.../ProductCard.tsx`, `material-escolar/page.tsx` | Modified | Consistent price source |
| `apps/frontend/.../producto/[id]/page.tsx` | Modified | Attribute-selector resolution, cart id |
| `apps/frontend/src/context/CartContext.tsx` | Modified | Structured varianteId/empaqueId |
| `apps/admin/.../ProductEditor.tsx`, MediaSection | Modified | Image reference sync, tab naming |
| `openspec/specs/catalogo-gestion/spec.md` | Follow-up (not this change) | Terminology + constraint fix |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Switching listing price source changes perceived pricing | Medium | Coordinate source choice (base vs. lowest empaque) with business before Phase 1 ships |
| Cleaning up historical phantom "Estándar" rows breaks references | Medium | Phase 1 only stops new creation; historical cleanup is a separate reviewed migration |
| Removing dead selector code without product sign-off | Low-Medium | Flagged as an open decision, not resolved unilaterally in this proposal |

## Rollback Plan

Each phase ships as independent, revertible commits; Phase 1 has no destructive migration. Any future historical data cleanup (phantom variants) ships as its own migration with a down-script.

## Dependencies

- Product decision: canonical listing price source, and attribute-selector fate.
- `catalogo-gestion` spec correction (deferred to `sdd-spec` phase of this change).

## Success Criteria

- [ ] Listing price always matches checkout price for the resolved empaque.
- [ ] Gallery image edits propagate to variant display without manual re-copy.
- [ ] No new "Estándar" variant created for non-varying products.
- [ ] `CartItem` carries structured `varianteId`/`empaqueId`.
- [ ] Dead JSON fields have an explicit resolution (activated or removed).
- [ ] Admin tab labeling distinguishes Variante from Empaque.
