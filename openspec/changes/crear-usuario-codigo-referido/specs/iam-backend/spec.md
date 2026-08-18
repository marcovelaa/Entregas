# Delta for IAM Backend

Formalizes previously-undocumented `codigoReferido` behavior on user
creation (DTO validation, uniqueness enforcement, and the admin
create-user form). No prior `spec.md` requirements existed for this
field, so all requirements below are ADDED.

## ADDED Requirements

### Requirement: Código Referido Length Validation

The system MUST validate that `codigoReferido` on user creation, when
provided, does not exceed 50 characters, and MUST reject longer values
with a 400 validation error before reaching the database layer.

#### Scenario: Código referido within limit is accepted

- GIVEN a create-user request with `codigoReferido` of 50 characters or fewer
- WHEN the request is submitted to `POST /usuarios`
- THEN the DTO validation passes and creation proceeds

#### Scenario: Código referido exceeding limit is rejected

- GIVEN a create-user request with `codigoReferido` longer than 50 characters
- WHEN the request is submitted to `POST /usuarios`
- THEN the system responds with 400 and a validation error naming `codigoReferido`
- AND no user is created

### Requirement: Código Referido Uniqueness Enforcement

The system MUST enforce that `codigoReferido` is unique across users at
the use-case/domain layer, using exact-string matching (no
case-insensitivity or trimming), and MUST return a clean domain-level 409
error — not a raw database constraint error — when a duplicate is
submitted, mirroring the existing email-uniqueness pattern.

#### Scenario: Duplicate código referido is rejected with a domain error

- GIVEN an existing user with `codigoReferido` = "REF123"
- WHEN a new user is created with `codigoReferido` = "REF123" (exact match)
- THEN the system responds with 409 and a clean domain error message (not a generic Prisma/Postgres message)
- AND no new user is created

#### Scenario: Distinct código referido is accepted

- GIVEN an existing user with `codigoReferido` = "REF123"
- WHEN a new user is created with `codigoReferido` = "REF124"
- THEN the user is created successfully

### Requirement: Código Referido Remains Optional

The system MUST continue to accept user creation requests that omit
`codigoReferido`, storing it as `null`, with no change to this existing
behavior.

#### Scenario: User created without código referido

- GIVEN a create-user request that omits `codigoReferido`
- WHEN the request is submitted to `POST /usuarios`
- THEN the user is created successfully with `codigoReferido` stored as `null`
- AND no uniqueness check is performed

### Requirement: Admin Create-User Form Código Referido Input

The admin "Crear Usuario" form MUST expose an optional `codigoReferido`
text input, client-side capped at 50 characters, wired into the
create-user request body. The form MUST surface the backend's
duplicate-código-referido error to the operator in a readable, specific
message — not a generic or raw error.

#### Scenario: Operator submits a código referido through the form

- GIVEN the operator opens the "Crear Usuario" form
- WHEN they enter a `codigoReferido` value and submit
- THEN the value is included in the create-user POST request body

#### Scenario: Form input enforces client-side max length

- GIVEN the operator is typing into the `codigoReferido` field
- WHEN they attempt to enter more than 50 characters
- THEN the input does not accept characters beyond the 50-character limit

#### Scenario: Form surfaces duplicate-código-referido error

- GIVEN the operator submits a `codigoReferido` that already belongs to another user
- WHEN the backend responds with the 409 domain error
- THEN the form displays a readable message identifying the duplicate código referido
- AND does not show a generic or raw backend error string

## Out of Scope (Non-Requirements)

- Editing `codigoReferido` after creation (`UpdateUsuarioDto`, edit form) is unchanged and not covered by this spec.
- Auto-generation of `codigoReferido` is not introduced; assignment stays manual.
- No downstream consumption (checkout/discounts) reads or redeems this field yet.
