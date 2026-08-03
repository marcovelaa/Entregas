## Intent
Allow administrators to duplicate packaging configurations (Empaques) from one variant to others within the same product, reducing manual data entry and speeding up catalog management.

## Scope
### In Scope
- Create a backend endpoint `POST /empaques/clonar`.
- Implement a Use Case to handle the duplication logic.
- Ensure cloned empaques do not violate `sku`, `codigo_barras`, or `[variante_id, nombre]` unique constraints.
- Add a UI element in `EmpaquesSection.tsx` to trigger the cloning process from another variant of the same product.

### Out of Scope
- Cloning variants or entire products.
- Cloning empaques across different products.

## Capabilities
### New Capabilities
- `clone-empaques`: Ability to clone all empaques from a source variant to one or multiple destination variants.

### Modified Capabilities
- None.

## Approach
1. **DTO (`ClonarEmpaquesDto`)**:
   Will receive `origen_variante_id` (bigint) and `destino_variante_ids` (array of bigints).
   
2. **Backend Use Case**:
   - Fetch all empaques for `origen_variante_id`.
   - For each `destino_variante_id`, map the source empaques to new records.
   - To avoid unique constraint violations (`sku`, `codigo_barras`, and `nombre` per variant):
     - `sku`: Generate a new unique SKU (e.g., appending a short random string or the destination variant ID).
     - `codigo_barras`: Set to `null`.
     - `nombre`: Check for existence or simply append ` (Copia)` if a collision is detected.
   - Insert the new empaques into the database.

3. **Frontend UI (`EmpaquesSection.tsx`)**:
   - Add a "Clonar de..." dropdown or action button.
   - Provide a list of other variants within the same product.
   - On selection, call the new endpoint and refresh the empaques list.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `apps/api/src/modules/empaques/` | Modified | Add `ClonarEmpaques` use case, controller endpoint, and DTO. |
| `apps/admin/.../EmpaquesSection.tsx` | Modified | Add UI element for the clone action. |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Unique constraint violations (`sku`, `codigo_barras`, `nombre`) | High | Auto-generate safe unique values for `sku`, set `codigo_barras` to null, and append suffixes to `nombre` if needed. |
| Silent failures on partial clones | Low | Run the clone operation within a database transaction. |

## Rollback Plan
Revert the commits introducing the new endpoint and UI components. Any cloned empaques will remain in the database but can be manually deleted by users.

## Dependencies
- None.

## Success Criteria
- [ ] Users can successfully clone empaques from one variant to another via the UI.
- [ ] No database unique constraint errors occur during the cloning process.
- [ ] The UI immediately displays the newly cloned empaques after the action succeeds.
