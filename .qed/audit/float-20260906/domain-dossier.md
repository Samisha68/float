# Domain dossier — float

Canonical data: `domain-dossier.json`.

## Structural candidates

| ID | Kind | Scope | Confidence | Summary |
|---|---|---|---|---|
| `c-43b054bf-account_type_tag_check-handler:approve_and_disburse` | `account_type_tag_check` | `handler:approve_and_disburse` | low | Handler `approve_and_disburse`: accounts are loaded only after their type discriminator is verified |
| `c-f85e9a14-arithmetic_no_overflow-handler:mark_overdue` | `arithmetic_no_overflow` | `handler:mark_overdue` | medium | Handler `mark_overdue`: token-amount and lamport arithmetic is checked (no silent wrap, no saturate) |
| `c-3d4d4f27-lifecycle_one_shot-handler:approve_and_disburse` | `lifecycle_one_shot` | `handler:approve_and_disburse` | low | Handler `approve_and_disburse`: init-style handlers move the account from Uninit to Init exactly once |

## Asset flows

Pending source review.

## Quantities and units

Pending source review.

## Lifecycle

Pending source review.

## Authority capabilities

Pending source review.

## Economic equations

Pending user ratification.

## External assumptions

Pending source review.
