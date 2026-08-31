# Float

On-chain short-term working-capital credit for businesses with delayed inbound payments —
a customer invoice not yet settled, a cross-border investor payment in flight, a temporary
banking block — while payroll and vendors still come due. A verified business applies with
evidence of its incoming funds; Float underwrites and disburses USDC; the loan, schedule and
repayment status are recorded on Solana; repayment builds a portable credit history.

Read README.md before anything else.

## Ground rules for this repo

**`archive/` is dead code.** It holds the March 2026 hackathon build — a *consumer mobile*
crypto lending app. It is not the product, not maintained, and must not be built on,
upgraded, or copied from beyond the Anchor account patterns noted in
[archive/README.md](archive/README.md). If a task seems to call for editing anything under
`archive/`, stop and ask — the answer is almost always that new code belongs elsewhere.

**Documents disagree with each other on purpose.** Several docs in `docs/` describe products
Float abandoned. Every superseded file carries a `<!-- float-status-banner -->` block at the
top saying what is dead and what is still live. Read that banner before trusting a document's
contents, and add one to any doc that gets superseded in future.

**No product surface exists yet** for the current direction. The live coming-soon splash page
is a *different project* in a *different repo* — `~/Projects/Float_website`, deployed by
Vercel. It is not in this repo and must not be edited from here as part of unrelated work.

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## gstack
Use /browse from gstack for all web browsing. Never use mcp__claude-in-chrome__* tools.
Available skills: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review,
/design-consultation, /design-shotgun, /design-html, /review, /ship, /land-and-deploy,
/canary, /benchmark, /browse, /open-gstack-browser, /qa, /qa-only, /design-review,
/setup-browser-cookies, /setup-deploy, /setup-gbrain, /sync-gbrain, /retro, /investigate,
/document-release, /document-generate, /codex, /cso, /autoplan, /pair-agent, /careful, /freeze,
/guard, /unfreeze, /gstack-upgrade, /learn.
