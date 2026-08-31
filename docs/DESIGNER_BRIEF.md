# Float — Designer Brief

<!-- float-status-banner -->
> **PARTIALLY LIVE — August 31, 2026.** The product described here (invoice factoring for
> payroll and staffing companies) is not the one Float settled on; the current product is
> short-term working-capital credit for businesses with delayed inbound payments — see the
> root [README.md](../README.md).
>
> Everything else transfers and this brief should still be sent to a designer: the audience
> (owners and finance managers at small businesses, anxious about deadlines), the
> desktop-first stance, the "calm, precise, boring in the best way" register, the ban on
> crypto aesthetics, and above all the identification of **status** as the hardest design
> problem. Swap the product description; keep the rest.

---

*Last updated: 1 August 2026*

## What Float is, in one line

Float gives payroll companies the cash to pay workers on time, and gets repaid when
their client's invoice comes in.

## The problem, in plain words

A staffing or payroll company supplies workers to a business. The workers must be paid
every week or two — that deadline never moves. But the business that hired them pays
the invoice 30 to 60 days later.

So the payroll company has to fund every payroll run out of its own pocket and wait
weeks to be reimbursed. Winning a bigger client makes it worse, because they have to
front more money for longer. This timing gap is one of the most common reasons
otherwise-profitable payroll companies run out of money.

Float closes that gap. The payroll company brings us an invoice they've already issued
to their client. We advance most of its value immediately so payroll goes out on time.
When the client pays the invoice, the money comes to us, we take our fee, and we send
the rest on.

## Who actually uses this

**Not consumers.** This is a business tool. The people logging in are:

- **Owners and finance managers at payroll and staffing companies.** Usually small
  operations, 5–50 staff. They are not designers or engineers. They live in
  spreadsheets, bank portals, and accounting software.
- **Float's own team** (internal screens): reviewing and approving requests, verifying
  invoices are genuine, watching exposure.

This audience matters. They are anxious about money and deadlines. They are checking
whether funds have arrived, whether an invoice cleared, whether they can make Friday.
They want certainty and speed, not delight.

## What they need to do

The whole product is one loop:

1. **Sign up** — verify the business is real (registration documents, ownership, bank details).
2. **Add an invoice** — upload or connect the invoice they've issued to their client.
3. **Wait for approval** — we check the invoice is genuine and the client is likely to pay.
4. **Get funded** — money arrives; they run payroll.
5. **Client pays** — the payment comes to us.
6. **Settled** — we take our fee and send the remainder on.

Then they do it again next payroll cycle. It's repetitive on purpose.

**Screens this implies:** a dashboard showing money in flight and what's available;
a list of invoices with clear status; a form to submit a new one; a detail view of a
single invoice and where it is in the loop; settlement history and statements; account
and business settings.

**Internal screens:** a review queue, invoice verification, client/employer records,
and exposure monitoring.

## The single hardest design problem

**Status.** At any moment a user needs to know, without thinking: where is my money,
what happens next, and when.

An invoice moves through several states — submitted, being verified, approved, funded,
waiting on the client, paid, settled, overdue. Most of the anxiety in this product
lives in those transitions. If someone has to email us to ask what's happening, the
design has failed.

## How it should feel

**Calm, precise, and boring in the best way.** This is money people are relying on to
pay other people. The register is closer to a bank statement or an air traffic display
than to a consumer app.

- Certainty over personality. No playful copy, no illustrations, no mascots.
- Numbers are the interface. They should be large, aligned, and easy to scan.
- Every state says what it means in words, not just colour.
- Speed matters more than polish. These users are often doing this the day before payroll.

**Avoid entirely:** crypto aesthetics — neon, dark casino energy, gradients, glow.
Nothing about this should look speculative. It's a financing tool for small businesses.

## Platform

**Desktop-first.** This is work done at a laptop, alongside accounting software and
bank portals. Mobile matters only for checking status on the go, not for submitting.

*(Note: earlier versions of Float were mobile-first consumer. That's no longer the
product. Ignore any older mobile designs.)*

## What's already fixed — please don't change

**Name:** Float. Lowercase in the wordmark.

**Logo:** The ascending arcade — three Roman arches, each opening taller than the last,
with a cornice over each level and no base. Files in `docs/brand/`:
- `float-mark.svg` — the mark alone
- `float-avatar.svg` / `float-avatar-400.png` — social avatar, white on black

**Colour — exactly four values, no others:**

| | Hex | Used for |
|---|---|---|
| White | `#FFFFFF` | Backgrounds, reversed text |
| Black | `#000000` | Logo ground, primary buttons |
| Dark blue | `#031329` | Headers, dark surfaces, body text on white |
| Grey | `#8A94A6` | Secondary text, borders, dividers |

Lighter and darker steps are **opacities of the same grey**, never new colours.

**Important consequence:** there is no red, amber, or green in the palette. So invoice
status — overdue, at risk, settled — cannot be communicated by colour alone. It has to
be carried by words, position, and weight. This is a real constraint and it's
deliberate; if it proves impossible for the status system, raise it rather than
quietly adding a fifth colour.

## What's open

- **Typography.** Poppins is what current assets use, but it was never formally chosen.
  Open to a better recommendation, especially something with strong tabular numerals,
  since this product is mostly numbers.
- **Everything about the product UI.** No screens have been designed yet.

## What we'd like first

1. The dashboard — what an operator sees when they log in the morning before payroll.
2. The invoice list, with the full status system worked out.
3. A single invoice detail view.

The status system is the piece worth the most thought.
