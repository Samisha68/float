/* The review queue. Float underwrites by hand, so this screen exists to make
   one decision easy to make well: fund this, ask for more, or say no.

   Everything the decision needs is on one screen: what is owed to the
   business, what it is asking for, what it has repaid before, and the invoice
   itself. */

import { useCallback, useEffect, useRef, useState } from "react";
import { Field, Rows } from "./journey/parts";
import { api, type Application, type User } from "./lib/api";
import { listApplications, stageOf, toAdvance } from "./lib/live";
import { date, money, stageLabel } from "./lib/prototype";
import "./prototype.css";

const NEEDS_DECISION = ["Requested", "NeedsInformation"];
const OPEN = [...NEEDS_DECISION, "Offered", "Accepted", "Active"];

const FILTERS = {
  "Needs a decision": (a: Application) => NEEDS_DECISION.includes(a.status),
  Open: (a: Application) => OPEN.includes(a.status),
  All: () => true,
} as const;
type Filter = keyof typeof FILTERS;

const message = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong. Please try again.";

export default function OperatorQueue({ user, onSignOut }: { user: User; onSignOut: () => Promise<void> }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filter, setFilter] = useState<Filter>("Needs a decision");
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [feeBps, setFeeBps] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const working = useRef(false);

  const refresh = useCallback(async () => setApplications(await listApplications()), []);

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

  const visible = applications.filter(FILTERS[filter]);
  const application = applications.find((a) => a.id === selected) ?? null;

  /* The suggested fee follows whichever application is open, until the
     operator types their own. */
  useEffect(() => {
    setFeeBps(application?.suggestedFeeBps ?? null);
    setNote("");
  }, [application?.id, application?.suggestedFeeBps]);

  const act = async (action: string, body: Record<string, unknown>, done: string) => {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setError("");
    try {
      await api<Application>(`/applications/${application!.id}/${action}`, body);
      await refresh();
      setToast(done);
      setNote("");
    } catch (e) {
      setError(message(e));
    } finally {
      working.current = false;
      setBusy(false);
    }
  };

  const decisions = application ? (
    <>
      {NEEDS_DECISION.includes(application.status) ? (
        <section className="fp-card">
          <h3>Your decision</h3>
          <Field
            label="Message to the business"
            hint="They will read this exactly as written. A rejection without a reason is worse than a slow yes."
          >
            <textarea rows={4} maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} />
          </Field>

          {application.status === "Requested" ? (
            <>
              <Field label="One-time fee (%)" hint={`Their record suggests ${(application.suggestedFeeBps ?? 0) / 100}%.`}>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.01}
                  value={(feeBps ?? 0) / 100}
                  onChange={(event) => setFeeBps(Math.round(Number(event.target.value) * 100))}
                />
              </Field>
              <Rows
                items={[
                  ["They receive", money(application.amount)],
                  ["Fee", money((application.amount * (feeBps ?? 0)) / 10000)],
                  ["They repay", <strong key="t">{money(application.amount * (1 + (feeBps ?? 0) / 10000))}</strong>],
                ]}
              />
              <div className="fp-actions fp-actions-start">
                <button
                  className="fp-button"
                  disabled={busy || !note.trim()}
                  onClick={() => void act("offer", { feeBps: feeBps ?? 0, note }, "Offer sent.")}
                >
                  {busy ? "Sending…" : "Send this offer"}
                </button>
                <button
                  className="fp-secondary"
                  disabled={busy || !note.trim()}
                  onClick={() => void act("information", { note }, "Asked for more information.")}
                >
                  Ask for more
                </button>
              </div>
            </>
          ) : null}

          <div className="fp-actions fp-actions-start">
            <button
              className="fp-secondary"
              disabled={busy || !note.trim()}
              onClick={() => void act("reject", { note }, "Application declined, with your reason.")}
            >
              Decline this application
            </button>
          </div>
          {!note.trim() ? <small className="fp-hint">Write a message first. Every decision goes back with a reason.</small> : null}
        </section>
      ) : null}

      {application.status === "Accepted" ? (
        <section className="fp-card">
          <h3>They accepted. Release the funds.</h3>
          <p>
            Recording this marks {money(application.amount)} as sent. Funding is simulated, so nothing moves until the
            treasury is live.
          </p>
          <button className="fp-button" disabled={busy} onClick={() => void act("fund", {}, "Disbursement recorded.")}>
            {busy ? "Recording…" : "Record the disbursement"}
          </button>
        </section>
      ) : null}

      {application.status === "Active" ? (
        <section className="fp-card">
          <h3>Waiting on repayment</h3>
          <p>
            {money(application.totalDue)} is due
            {application.dueAt ? ` on ${date(new Date(application.dueAt).toISOString().slice(0, 10))}` : ""}. The
            business repays from its own wallet; Float verifies the transaction before it counts.
          </p>
        </section>
      ) : null}
    </>
  ) : null;

  return (
    <div className="fp fp-app">
      <aside className="fp-sidebar">
        <span className="fp-brand">
          <img src="/float-logo.svg" alt="Float" />
        </span>
        <nav>
          {(Object.keys(FILTERS) as Filter[]).map((name) => (
            <button
              key={name}
              aria-current={filter === name ? "page" : undefined}
              onClick={() => {
                setFilter(name);
                setSelected(null);
              }}
            >
              {name}
              {name === "Needs a decision" ? ` (${applications.filter(FILTERS[name]).length})` : ""}
            </button>
          ))}
        </nav>
        <div className="fp-sidebar-foot">
          <strong>{user.name || "Float operations"}</strong>
          <small>Operator</small>
        </div>
      </aside>

      <div className="fp-main">
        <header className="fp-top">
          <span>{visible.length} application{visible.length === 1 ? "" : "s"}</span>
          <span className="fp-pill">Simulated funding · no real money</span>
        </header>

        <main className="fp-content">
          <h1 className="fp-title">{application ? application.businessName : "Review queue"}</h1>

          {error ? (
            <p className="fp-error" role="alert">
              {error}
            </p>
          ) : null}

          {loading ? <p role="status">Loading the queue…</p> : null}

          {!loading && !application ? (
            <section className="fp-card">
              {visible.length ? (
                visible.map((a) => {
                  const item = toAdvance(a);
                  return (
                    <div className="fp-row-item" key={a.id}>
                      <div>
                        <strong>{a.businessName}</strong>
                        <small>
                          {money(a.amount)} against {money(a.expectedInflow)} from {a.payer} · {a.termDays} days ·{" "}
                          {a.borrowerRecord ?? 0} repaid before
                        </small>
                      </div>
                      <button className="fp-secondary" onClick={() => setSelected(a.id)}>
                        {stageLabel[stageOf(a)]} · open
                      </button>
                    </div>
                  );
                })
              ) : (
                <p>Nothing here. Every application in this view has been dealt with.</p>
              )}
            </section>
          ) : null}

          {application ? (
            <>
              <div className="fp-actions fp-actions-start">
                <button className="fp-secondary" onClick={() => setSelected(null)}>
                  Back to the queue
                </button>
              </div>

              <section className="fp-card">
                <div className="fp-card-head">
                  <p className="fp-eyebrow">{application.invoiceNumber}</p>
                  <span className="fp-pill">{stageLabel[stageOf(application)]}</span>
                </div>
                <Rows
                  items={[
                    ["Asking for", <strong key="a">{money(application.amount)}</strong>],
                    ["For", `${application.termDays} days`],
                    ["Owed to them", `${money(application.expectedInflow)} from ${application.payer}`],
                    ["Their payment due", date(application.invoiceDue)],
                    ["Repaid with Float before", `${application.borrowerRecord ?? 0}`],
                    ["Wallet", application.wallet ? `${application.wallet.slice(0, 8)}…` : "Not linked"],
                    [
                      "Invoice",
                      <a key="doc" href={`/api/applications/${application.id}/document`} target="_blank" rel="noreferrer">
                        {application.documentName}
                      </a>,
                    ],
                  ]}
                />
              </section>

              {decisions}

              <section className="fp-card">
                <h3>History</h3>
                {application.events.map((event, index) => (
                  <div className="fp-row-item" key={`${event.at}-${index}`}>
                    <div>
                      <strong>{event.actor}</strong>
                      <small>{event.message}</small>
                    </div>
                    <span>{new Date(event.at).toLocaleDateString()}</span>
                  </div>
                ))}
              </section>
            </>
          ) : null}

          <div className="fp-actions fp-actions-start">
            <button className="fp-secondary" onClick={() => void onSignOut()}>
              Sign out
            </button>
          </div>
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
