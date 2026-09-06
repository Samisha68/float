# Spec interview — float

_Generated: 2026-09-06T03:25:57.639638000Z_

The probe identified **3 candidate spec clauses**. For each one, check ONE option below by replacing `[ ]` with `[x]`. Add rationale under `_notes:_` where useful — the rejection path and bug path both benefit from a one-line reason.

Options across every cluster:

- **accept** — emit the suggested clause into the generated `.qedspec`
- **narrow** (program-scope clusters only) — emit per-handler `requires` clauses instead of a single program invariant
- **reject** — the proposed clause is an over-claim; drop it and note the reason
- **bug** — the implicit precondition is real but NOT enforced anywhere; flag as a finding rather than a spec clause

---

## Medium-confidence clusters

<!-- cluster: c-f85e9a14-arithmetic_no_overflow-handler:mark_overdue -->
_confidence: **Medium** · scope: **handler:mark_overdue** · evidence: **3** findings_

## checked_arithmetic

3 unchecked arithmetic site(s) in handler `mark_overdue` imply this per-handler precondition.

- [ ] **accept** — emit the suggested clause into the spec
- [ ] **reject** — over-claim; drop with rationale below
- [ ] **bug** — flag as missing enforcement (not a spec clause)

_notes:_


<details><summary>Suggested spec syntax (renders on accept)</summary>

```
  // TODO ratified (arithmetic_no_overflow in mark_overdue): token-amount and lamport arithmetic is checked (no silent wrap, no saturate)
  // Target form: // Use `+=` / `-=` (checked, v2.7 G3) in effect blocks; not `+=?` (wrap) or `+=!` (saturate)
```

</details>

---

## Low-confidence clusters

<!-- cluster: c-43b054bf-account_type_tag_check-handler:approve_and_disburse -->
_confidence: **Low** · scope: **handler:approve_and_disburse** · evidence: **1** finding_

## account_type_tag_checked

1 type-tag-free deserialization site(s) in handler `approve_and_disburse` imply this per-handler precondition.

- [ ] **accept** — emit the suggested clause into the spec
- [ ] **reject** — over-claim; drop with rationale below
- [ ] **bug** — flag as missing enforcement (not a spec clause)

_notes:_


<details><summary>Suggested spec syntax (renders on accept)</summary>

```
  // TODO ratified (account_type_tag_check in approve_and_disburse): accounts are loaded only after their type discriminator is verified
  // Target form: requires <account> is .<ExpectedVariant> else InvalidAccountType
```

</details>

---

<!-- cluster: c-3d4d4f27-lifecycle_one_shot-handler:approve_and_disburse -->
_confidence: **Low** · scope: **handler:approve_and_disburse** · evidence: **1** finding_

## init_is_one_shot

1 init-without-is-initialized site(s) in handler `approve_and_disburse` imply this per-handler precondition.

- [ ] **accept** — emit the suggested clause into the spec
- [ ] **reject** — over-claim; drop with rationale below
- [ ] **bug** — flag as missing enforcement (not a spec clause)

_notes:_


<details><summary>Suggested spec syntax (renders on accept)</summary>

```
  // TODO ratified (lifecycle_one_shot in approve_and_disburse): init-style handlers move the account from Uninit to Init exactly once
  // Target form: // Model as `handler init : State.Uninit -> State.Init` + `establishes init_is_one_shot`
```

</details>

---

## When done

Save this file, then re-invoke the auditor (`/audit` or `qedgen audit --resume`). The auditor reads your choices, writes accepted clauses to `<program>.qedspec`, rejected ones to `.qed/plan/scoping.md`, and flags `bug` choices into `.qed/findings/`.

Unchecked questions are treated as **deferred** — leaving the file partially-answered is fine; the auditor only acts on clusters with exactly one option checked.
