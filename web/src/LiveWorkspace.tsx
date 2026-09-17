/* The live borrower workspace: the journey from the prototype, driven by the
   API. Screens come from `journey/`, so the words here match the offline
   version exactly; only the source of truth changes. */

import { useCallback, useEffect, useRef, useState } from "react";
import { AdvanceCard, type AdvanceHandlers, type AdvanceView } from "./journey/AdvanceCard";
import { Field, Rows, Upload } from "./journey/parts";
import { invoiceFile, type User } from "./lib/api";
import {
  act,
  current,
  fetchQuote,
  listApplications,
  repaidCount,
  submitApplication,
  toAdvance,
  type Application,
  type Quote,
} from "./lib/live";
import { BASE_MARGIN, TERMS, date, isoDate, marginRequired, money, stageLabel } from "./lib/prototype";
import "./prototype.css";

/* The API caps a single advance at $5,000, which is the program's first-tier
   ceiling. The form must not offer more than the server will accept. */
const MIN_AMOUNT = 500;
const MAX_AMOUNT = 5000;

const TABS = ["Dashboard", "Your record", "Business"] as const;
type Tab = (typeof TABS)[number];

const message = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong. Please try again.";

type Draft = {
  payer: string;
  invoiceNumber: string;
  invoiceDue: string;
  expectedInflow: string;
  amount: number;
  termDays: number;
};

const emptyDraft = (): Draft => ({
  payer: "",
  invoiceNumber: "",
  invoiceDue: "",
  expectedInflow: "",
  amount: 2500,
  termDays: 30,
});

export default function LiveWorkspace({ user, onSignOut }: { user: User; onSignOut: () => Promise<void> }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [tab, setTab] = useState<Tab>("Dashboard");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [applying, setApplying] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [quote, setQuote] = useState<Quote | null>(null);
  /* What the same advance would cost now that this one is repaid. */
  const [earned, setEarned] = useState<Quote | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const working = useRef(false);

  const refresh = useCallback(async () => setApplications(await listApplications()), []);

  const record = repaidCount(applications);
  const open = current(applications);
  const advance = open ? toAdvance(open) : null;
  /* The form is on screen whenever there is nothing open to show, not only
     when a borrower asked to apply again. */
  const showingForm = applying || !advance;

  useEffect(() => {
    refresh()
      .catch((e) => setError(message(e)))
      .finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    heading.current?.focus();
  }, [tab, applying]);

  /* The price always comes from the server, so what a borrower reads here is
     what the operator's queue will suggest. */
  useEffect(() => {
    if (!showingForm) return;
    const timer = setTimeout(() => {
      fetchQuote(draft.amount, draft.termDays)
        .then(setQuote)
        .catch(() => setQuote(null));
    }, 250);
    return () => clearTimeout(timer);
  }, [showingForm, draft.amount, draft.termDays]);

  /* The repaid screen compares what this advance cost with what the next one
     costs, on the same amount and term. Without the second price the screen
     shows the discount as zero, which is the opposite of what happened. */
  useEffect(() => {
    if (!advance || advance.stage !== "repaid") {
      setEarned(null);
      return;
    }
    let cancelled = false;
    fetchQuote(advance.amount, advance.days)
      .then((next) => !cancelled && setEarned(next))
      .catch(() => !cancelled && setEarned(null));
    return () => {
      cancelled = true;
    };
  }, [advance?.id, advance?.stage, advance?.amount, advance?.days]);

  /* One action at a time, and the list is re-read from the server afterwards
     rather than patched locally: the server decides what state things are in. */
  const run = async (work: () => Promise<void>, done: string) => {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setError("");
    try {
      await work();
      await refresh();
      setToast(done);
    } catch (e) {
      setError(message(e));
    } finally {
      working.current = false;
      setBusy(false);
    }
  };


  const validate = () => {
    const found: Record<string, string> = {};
    const incoming = Number(draft.expectedInflow);
    if (!draft.payer.trim()) found.payer = "Tell us who owes you this money.";
    if (!draft.invoiceNumber.trim()) found.invoiceNumber = "The invoice or reference number.";
    if (!draft.invoiceDue) found.invoiceDue = "When is this payment due?";
    if (!(incoming > 0)) found.expectedInflow = "How much is coming in?";
    else if (incoming < draft.amount)
      found.expectedInflow = `This has to cover the ${money(draft.amount)} you're asking for.`;
    if (draft.amount < MIN_AMOUNT || draft.amount > MAX_AMOUNT)
      found.amount = `Advances run from ${money(MIN_AMOUNT)} to ${money(MAX_AMOUNT)}.`;
    if (!file) found.document = "Attach the invoice as a PDF, PNG or JPG.";
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const send = async () => {
    if (!validate() || !file) return;
    await run(async () => {
      const document = await invoiceFile(file);
      await submitApplication({
        payer: draft.payer.trim(),
        invoiceNumber: draft.invoiceNumber.trim(),
        invoiceDue: draft.invoiceDue,
        amount: draft.amount,
        expectedInflow: Number(draft.expectedInflow),
        termDays: draft.termDays,
        document,
      });
      setApplying(false);
      setDraft(emptyDraft());
      setFile(null);
      setFileName([]);
      setErrors({});
    }, "Application sent. We’ll come back with a decision.");
  };

  const handlers: AdvanceHandlers = advance
    ? {
        onRespond: (reply) => void run(() => act(advance.id, "respond", { note: reply }).then(() => undefined), "Sent. Your application is back with us."),
        onAccept: () => void run(() => act(advance.id, "accept").then(() => undefined), "Accepted. We’re sending the funds."),
        onDecline: () => void run(() => act(advance.id, "decline").then(() => undefined), "Offer declined. Nothing was charged."),
        onRepay: () => void run(() => act(advance.id, "repay").then(() => undefined), "Repaid. That’s one more on your record."),
        onSeeRecord: () => setTab("Your record"),
        onStartAgain: () => {
          setApplying(true);
          setTab("Dashboard");
        },
      }
    : {};

  const view: AdvanceView | null = advance
    ? {
        ...advance,
        reference: advance.invoiceNumber,
        business: user.name,
        record,
        marginEarned: BASE_MARGIN - marginRequired(record),
        daysLeft: advance.dueOn
          ? Math.round((new Date(`${advance.dueOn}T12:00:00`).getTime() - Date.now()) / 86_400_000)
          : null,
        nextRate: earned?.rate ?? advance.rate,
        nextFee: earned?.fee ?? advance.fee,
      }
    : null;

  const form = (
    <div className="fp-grid">
      <form
        className="fp-card"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <h2>What’s coming in</h2>
        <p>We lend against money you are already owed, so this part decides everything.</p>
        <div className="fp-form-grid">
          <Field label="Who owes you" error={errors.payer}>
            <input value={draft.payer} onChange={(e) => setDraft({ ...draft, payer: e.target.value })} />
          </Field>
          <Field label="Invoice or reference" error={errors.invoiceNumber}>
            <input
              value={draft.invoiceNumber}
              onChange={(e) => setDraft({ ...draft, invoiceNumber: e.target.value })}
            />
          </Field>
          <Field label="Amount owed to you" error={errors.expectedInflow}>
            <input
              type="number"
              min={0}
              value={draft.expectedInflow}
              onChange={(e) => setDraft({ ...draft, expectedInflow: e.target.value })}
            />
          </Field>
          <Field label="When you expect it" error={errors.invoiceDue}>
            <input
              type="date"
              min={isoDate()}
              value={draft.invoiceDue}
              onChange={(e) => setDraft({ ...draft, invoiceDue: e.target.value })}
            />
          </Field>
        </div>
        <Upload
          label="The invoice"
          files={fileName}
          error={errors.document}
          multiple={false}
          onChange={setFileName}
          onPick={setFile}
        />

        <hr />

        <h2>How much do you need now</h2>
        <p>Up to the amount that’s coming in, for as long as you need it.</p>
        <div className="fp-field">
          <label className="fp-label" htmlFor="live-amount">
            Amount
          </label>
          <input
            id="live-amount"
            className="fp-amount"
            type="number"
            min={MIN_AMOUNT}
            max={MAX_AMOUNT}
            step={100}
            value={draft.amount}
            onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })}
          />
          <input
            className="fp-slider"
            type="range"
            aria-label="Amount slider"
            min={MIN_AMOUNT}
            max={MAX_AMOUNT}
            step={100}
            value={draft.amount}
            onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })}
          />
          <span className="fp-scale">
            <span>{money(MIN_AMOUNT)}</span>
            <span>{money(MAX_AMOUNT)}</span>
          </span>
          {errors.amount ? <small className="fp-error">{errors.amount}</small> : null}
        </div>
        <fieldset className="fp-field fp-fieldset">
          <legend className="fp-label">How long you need it</legend>
          <div className="fp-chips">
            {TERMS.map((days) => (
              <button
                key={days}
                type="button"
                aria-pressed={draft.termDays === days}
                onClick={() => setDraft({ ...draft, termDays: days })}
              >
                {days} days
              </button>
            ))}
          </div>
        </fieldset>

        <div className="fp-actions">
          {applications.length ? (
            <button type="button" className="fp-secondary" onClick={() => setApplying(false)}>
              Back
            </button>
          ) : (
            <span />
          )}
          <button className="fp-button" disabled={busy}>
            {busy ? "Sending…" : "Send application"}
          </button>
        </div>
      </form>

      <aside>
        <section className="fp-card fp-quote" aria-label="Your price">
          <p className="fp-eyebrow">What this costs</p>
          {quote ? (
            <>
              <Rows
                items={[
                  ["You receive", money(quote.amount)],
                  ["Term", `${quote.days} days`],
                  ["Fee", `${quote.rate}% · ${money(quote.fee)}`],
                  ["You repay", <strong key="total">{money(quote.total)}</strong>],
                ]}
              />
              <p className="fp-note">
                {quote.discount > 0
                  ? `Your record took ${quote.discount} points off this fee. A new business pays ${quote.base}%.`
                  : "Repay on time and your next advance costs less. The amount stays tied to what’s coming in."}
              </p>
              <p className="fp-note">Indicative. Float confirms the fee when it makes you an offer.</p>
            </>
          ) : (
            <p className="fp-note">Choose an amount and a term to see the price.</p>
          )}
        </section>
      </aside>
    </div>
  );

  const dashboard = showingForm ? form : <AdvanceCard view={view!} handlers={handlers} busy={busy} />;

  const recordTab = (
    <>
      <section className="fp-card fp-record">
        <p className="fp-eyebrow">What you’ve repaid</p>
        <strong className="fp-big">
          {record} {record === 1 ? "repayment" : "repayments"}
        </strong>
        <p>
          Every repayment lowers what your next advance costs. Once your record is written to Solana it will be yours to
          take anywhere: readable by any lender, in any country, without our permission.
        </p>
        <p className="fp-note">
          Not on Solana yet. Repayments are recorded in this workspace while the on-chain write is being built.
        </p>
      </section>

      <div className="fp-metrics">
        <div>
          <span>Repayments</span>
          <strong>{record}</strong>
          <p>{record ? "Priced into your next advance" : "Your record starts with your first repayment"}</p>
        </div>
        <div>
          <span>Collateral margin</span>
          <strong>{marginRequired(record)}%</strong>
          <p>On larger, asset-backed advances</p>
        </div>
        <div>
          <span>Advance limit</span>
          <strong>Whatever’s coming in</strong>
          <p>Your record changes the price, never the size</p>
        </div>
      </div>

      <section className="fp-card">
        <h3>Everything you’ve applied for</h3>
        {applications.length ? (
          applications.map((application) => {
            const item = toAdvance(application);
            return (
              <div className="fp-row-item" key={item.id}>
                <div>
                  <strong>{money(item.amount)}</strong>
                  <small>
                    {item.payer} · {item.invoiceNumber} · applied {date(item.requestedOn)}
                  </small>
                </div>
                <span>{stageLabel[item.stage]}</span>
              </div>
            );
          })
        ) : (
          <p>Nothing yet. Your first application will appear here.</p>
        )}
      </section>
    </>
  );

  const businessTab = (
    <section className="fp-card">
      <h2>{user.name}</h2>
      <Rows
        items={[
          ["Business", user.name],
          ["Signed in as", user.email.endsWith("@privy.local") ? "Wallet and email through Privy" : user.email],
          ["Role", user.role === "operator" ? "Operator" : "Borrower"],
        ]}
      />
      <p className="fp-note">
        Business verification is handled by Float for now. Ask us if you need anything here changed.
      </p>
      <div className="fp-actions fp-actions-start">
        <button className="fp-secondary" onClick={() => void onSignOut()}>
          Sign out
        </button>
      </div>
    </section>
  );

  const title =
    tab !== "Dashboard"
      ? tab
      : showingForm
        ? record
          ? "Your next advance"
          : "Your first advance"
        : `Hello, ${user.name}`;

  return (
    <div className="fp fp-app">
      <aside className="fp-sidebar">
        <span className="fp-brand">
          <img src="/float-logo.svg" alt="Float" />
        </span>
        <nav>
          {TABS.map((name) => (
            <button
              key={name}
              aria-current={tab === name ? "page" : undefined}
              onClick={() => {
                setTab(name);
                setApplying(false);
              }}
            >
              {name}
            </button>
          ))}
        </nav>
        <div className="fp-sidebar-foot">
          <strong>{user.name}</strong>
          <small>Business workspace</small>
        </div>
      </aside>

      <div className="fp-main">
        <header className="fp-top">
          <span>{advance ? stageLabel[advance.stage] : "No open advance"}</span>
          <span className="fp-pill">Simulated funding · no real money</span>
        </header>

        <main className="fp-content">
          <h1 className="fp-title" tabIndex={-1} ref={heading}>
            {title}
          </h1>

          {error ? (
            <p className="fp-error" role="alert">
              {error}
            </p>
          ) : null}

          {loading ? (
            <p role="status">Opening your workspace…</p>
          ) : (
            <>
              {tab === "Dashboard" ? dashboard : null}
              {tab === "Your record" ? recordTab : null}
              {tab === "Business" ? businessTab : null}
              {tab === "Dashboard" && advance && !applying && advance.stage !== "requested" ? null : null}
            </>
          )}
        </main>
      </div>

      {toast ? (
        <p className="fp-toast" role="status">
          {toast}
        </p>
      ) : null}
    </div>
  );
}
