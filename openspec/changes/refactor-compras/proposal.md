<Proposal: refactor-compras-module>
## Intent

The `registrar-compra` process in the Compras module is currently broken and violates architectural principles. This change will refactor the module to use a single database transaction, decouple it from `PrismaService` by using repositories/unit of work, correctly update inventory stock, and accurately update variant prices with packaging context.

## Scope

### In Scope
- Add `empaque_id` to `CompraDetalleDto` and schema validations.
- Refactor `RegistrarCompraUseCase` to eliminate direct `PrismaService` injection.
- Implement transactional atomicity (Unit of Work or transaction client) for purchase creation, inventory movement, and price updates.
- Complete the variant price update logic (fix the `/* removed */` code).
- Implement stock increase logic (Inventory Movement) on purchase via Domain Service or explicit `IInventarioRepository` calls.

### Out of Scope
- Refactoring other use cases within the Compras module that are not related to `registrar-compra`.
- Changes to the frontend interface for registering purchases.

## Capabilities

### New Capabilities
- `registrar-movimiento-inventario`: Create a new inventory movement record to increase stock when a purchase is registered.
- `transaccion-compra`: Execute the entire purchase registration process within a single database transaction.

### Modified Capabilities
- `registrar-compra`: Updated to support `empaque_id` for details, ensure transactionality, correctly update variant prices, and trigger inventory updates without direct infrastructure dependencies.

## Approach

1. **DTO Update:** Add `empaque_id` to `CompraDetalleDto` to retain packaging context.
2. **Architecture Refactoring:** Remove direct `PrismaService` injection from `RegistrarCompraUseCase`. Instead, introduce a transaction management mechanism (e.g., Unit of Work or passing a Prisma transaction client to repositories).
3. **Inventory Update:** Introduce a call to `IInventarioRepository` (or an Inventory Domain Service) inside the use case to register a "Movimiento de Inventario" for each item purchased, increasing the stock.
4. **Price Update Fix:** Replace the `/* removed */` placeholder with the actual logic to update product variant prices, ensuring this occurs inside the main transaction.
5. **Transactional Consistency:** Wrap the purchase creation, detail creation, inventory movements, and price updates in a single, atomic operation.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/compras/application/use-cases/registrar-compra.use-case.ts` | Modified | Refactor to remove PrismaService, wrap in transaction, call inventory, fix price update |
| `src/compras/application/dtos/compra.dto.ts` | Modified | Add `empaque_id` validation |
| `src/compras/domain/repositories/` | Modified | Potential updates to support transaction clients |
| `src/inventario/domain/repositories/` | Modified | Potential updates to support transaction clients |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Transaction deadlocks during concurrent purchase and inventory updates | Low | Ensure the transaction scope is as small and fast as possible, acquiring locks in a consistent order. |
| Incomplete refactor leaving orphan `PrismaService` references | Low | Strict code review and testing of the `RegistrarCompraUseCase` integration. |

## Rollback Plan

Revert the commits introducing the refactored `RegistrarCompraUseCase`, the DTO changes, and the transaction management mechanism. Ensure that any database schema changes (if applicable, though seemingly none) are safely backward compatible.

## Dependencies

- Existing Prisma schema configurations for `Compra`, `MovimientoInventario`, and `Variante`.
- `IInventarioRepository` must exist and be accessible to the Compras module.

## Success Criteria

- [ ] `CompraDetalleDto` successfully validates `empaque_id`.
- [ ] `RegistrarCompraUseCase` no longer injects `PrismaService`.
- [ ] A purchase successfully creates a `Compra` record, updates variant prices, and generates `MovimientoInventario` records atomically.
- [ ] An error in any part of the process rolls back the entire operation.
