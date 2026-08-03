# Proposal: Fix Volume NxF (`LLEVA_X_PAGA_Y`) and Separate Combo Bundles

## 1. Problem Statement
The current implementation of `LLEVA_X_PAGA_Y` pooled all eligible items into a single global price array, sorted ascending, and discounted the lowest-priced items across different products.
This led to two major bugs:
1. **Under-discounting in multi-product 2x1**: Buying 2 notebooks ($25 ea) and 2 pens ($18 ea) gave $36 discount ($18 + $18) instead of $43 ($25 + $18).
2. **False mix-and-match**: Buying 1 notebook ($25) and 1 pen ($18) triggered a 2x1 discount giving the pen away for free, even though neither product reached 2 units.
3. **Empty COMBO logic**: `COMBO` was an alias of `LLEVA_X_PAGA_Y` without bundle-matching capabilities.

## 2. Proposed Solution
1. **Per-Product / Per-Variant Evaluation for `LLEVA_X_PAGA_Y`**:
   - Group matching cart items by product/variant key (`${item.productoId}-${item.varianteId || 'default'}-${item.empaqueId || 'unit'}`).
   - Evaluate NxF sets for each group independently:
     `sets = Math.floor(group.cantidad / req)`
     `freeUnits = sets * (req - paga)`
     `groupSavings = freeUnits * group.precioUnitario`
   - Sum savings across all groups.
2. **Dedicated `COMBO` Strategy**:
   - For `COMBO`, require that ALL configured target products/variants are present in the cart in required proportions.
   - Compute sets completed as `min(cartQuantity / requiredQuantity)` across all required components.
3. **Live Simulator Alignment**:
   - Update `LivePromoSimulator.tsx` to display item-by-item breakdown of completed NxF sets and exact unit savings.
