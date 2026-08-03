<Proposal: Rediseño Frontend de Compras>
## Intent
Redesign the "Registrar Compra" (New Purchase) frontend interface to improve usability and correctly handle complex product hierarchies (products, variants, packaging) without layout constraints.

## Scope

### In Scope
- A multi-step wizard or full-screen layout separating product selection from cart review.
- Advanced product search and selection UI accommodating multi-dimensional variants and packaging.
- Inputs for purchase quantity, unit cost, and updated sale price for the selected product/variant.
- Cart summary view to review all items before confirming the purchase.

### Out of Scope
- Backend modifications (API and DB remain the same).
- Changes to the general product catalog management screens.

## Capabilities

### New Capabilities
- `purchase-wizard-flow`: Step-by-step or modal-based flow to add items to a purchase cart without cramped split views.
- `variant-selection-ui`: Clear visual hierarchy in the UI for selecting a product, then its specific variant (e.g., Color), and packaging (Empaque).

### Modified Capabilities
- `purchase-creation`: Replaces the legacy 50/50 split screen with a fluid, full-width UI to prevent information overlap and scrolling issues.

## Approach
Implement a Two-Step Wizard layout. 
Step 1: "Add Products" - A full-screen searchable catalog where clicking a product opens a modal or slide-over to select the exact variant/empaque, input cost, price, and quantity, then adds it to the cart. 
Step 2: "Review Cart" - A clear, wide summary table of all added items, total costs, and final submission button.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `apps/admin/src/app/compras/nueva/page.tsx` | New | Replaced the deleted file with the new Wizard layout. |
| `apps/admin/src/components/compras/` | New | New components for product search, variant modal, and cart review. |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| State management complexity across steps | Medium | Use a robust global store (e.g., Zustand) or Context for the purchase cart. |
| Learning curve for existing users | Low | Use established POS/Wizard design patterns with clear calls to action. |

## Rollback Plan
If the new flow is critically bugged, revert the Git commit that introduces the new UI to restore the previously deleted 50/50 split-screen implementation.

## Dependencies
- Existing backend API for creating purchases (`POST /compras`).
- Products and variations API endpoints to fetch catalog data.

## Success Criteria
- [ ] Users can navigate the purchase process smoothly without horizontal scrolling or cramped text.
- [ ] Multi-dimensional variants (e.g., Color + Empaque) are easily selectable when adding a product.
- [ ] Purchase completes successfully against the existing backend.
</Proposal: Rediseño Frontend de Compras>
