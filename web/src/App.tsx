import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { DashboardOverview } from "./DashboardOverview";
import DemoApp from "./DemoApp";
import Onboarding from "./Onboarding";
import ApplicationForm from "./InvoiceApplication";
import { api, Application, User } from "./lib/api";
import { shortDate, usd } from "./lib/domain";

const DevnetApp = lazy(() => import("./DevnetApp"));
const labels: Record<Application["status"], string> = {
  Requested: "Awaiting review",
  NeedsInformation: "Information needed",
  Offered: "Offer ready",
  Accepted: "Ready for test funding",
  Active: "Repayment due · simulated",
  Repaid: "Repaid · simulated",
  Rejected: "Not approved",
  Declined: "Offer declined",
};
const amount = (n: number) => `${usd(n)} USDC`;
const message = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong. Please try again.";

export default function App() {
  if (new URLSearchParams(location.search).get("mode") === "devnet")
    return (
      <Suspense fallback={<p className="app-main">Opening devnet test…</p>}>
        <DevnetApp />
      </Suspense>
    );
  if (new URLSearchParams(location.search).get("mode") === "demo")
    return <DemoApp />;
  return <Onboarding>{(user, onLogout) => <Workspace key={user.id} initialUser={user} onLogout={onLogout}/>}</Onboarding>;
}
function Workspace({initialUser, onLogout}: {initialUser: User; onLogout:()=>Promise<void>}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState<Application[]>([]);
  const [view, setView] = useState<"list" | "new">("list");
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const refresh = async () =>
    setItems(await api<Application[]>("/applications"));
  useEffect(() => {
    refresh()
      .catch((e) => setError(message(e)))
      .finally(() => setLoading(false));
  }, []);
  const run = async (work: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (e) {
      setError(message(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const action = (id: string, name: string, body = {}) =>
    run(async () => {
      await api(`/applications/${id}/${name}`, body);
      await refresh();
    });
  const current = items.find((a) => a.id === selected);
  const pending = items.filter((a) =>
    ["Requested", "NeedsInformation", "Offered", "Accepted"].includes(a.status),
  );
  const active = items.filter((a) => a.status === "Active");
  return (
    <div className="workspace">
      <header className="app-header">
        <a className="brand" href="/">
          <img src="/float-favicon.svg" alt="Float" className="brand-symbol" /><span className="brand-dot">/</span>
          <span className="brand-context">working capital</span>
        </a>
        <div className="header-actions">
          <span className="wallet-status">Wallet connected</span>
          {user && (
            <>
              <span>{user.name}</span>
              <button
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await onLogout();
                    setUser(null);
                    setItems([]);
                    setSelected(null);
                    setView("list");
                  })
                }
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </header>
      <div className="pilot-banner">
        <strong>Early access</strong>
        <span>
          Applications are saved. Funding and repayments are simulated; no money
          moves.
        </span>
      </div>
      {error && (
        <div role="alert" className="notice">
          <span>{error}</span>
          <button aria-label="Dismiss message" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}
      {loading ? (
        <main className="app-main">
          <p role="status">Opening your workspace…</p>
        </main>
      ) : !user ? null : (
        <main className="app-main">
          <div className="workspace-heading">
            <div>
              <p className="eyebrow">
                {user.role === "operator" ? "Float operations" : user.name}
              </p>
              <h1>
                {user.role === "operator"
                  ? "Review workspace"
                  : `Hello, ${user.name}.`}
              </h1>
            </div>
            <div className="inline-actions">
              <button
                className="secondary"
                disabled={busy}
                onClick={() => void run(refresh)}
              >
                Refresh
              </button>
              {user.role === "borrower" && (
                <button
                  className="primary"
                  onClick={() => {
                    setView("new");
                    setSelected(null);
                  }}
                >
                  Apply with an invoice <span aria-hidden>↗</span>
                </button>
              )}
            </div>
          </div>
          {user.role === "borrower" && view === "list" && !current && <DashboardOverview name={user.name} items={items} onApply={()=>{setView("new");setSelected(null)}} onSelect={setSelected}/> }
          {user.role === "operator" && <section className="metrics" aria-label="Portfolio summary">
            <Metric
              label="Applications in progress"
              value={String(pending.length)}
            />
            <Metric
              label="Simulated outstanding"
              value={amount(active.reduce((n, a) => n + a.totalDue, 0))}
            />
            <Metric
              label="Completed test advances"
              value={String(items.filter((a) => a.status === "Repaid").length)}
            />
          </section>}
          {view === "new" ? (
            <ApplicationForm
              busy={busy}
              onCancel={() => setView("list")}
              onSubmit={async (data) => {
                const a = await api<Application>("/applications", data);
                await refresh();
                setView("list");
                setSelected(a.id);
                window.scrollTo({top:0,behavior:"smooth"});
              }}
            />
          ) : current ? (
            <ApplicationDetail
              application={current}
              user={user}
              busy={busy}
              onBack={() => setSelected(null)}
              onAction={(name, body) => action(current.id, name, body)}
            />
          ) : (
            <>
              <div className="list-heading">
                <h2>
                  {user.role === "operator"
                    ? "Applications to manage"
                    : "Applications"}
                </h2>
                <label className="filter">
                  Show{" "}
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All applications</option>
                    <option value="pending">In progress</option>
                    <option value="active">Funded (simulated)</option>
                    <option value="closed">Closed</option>
                  </select>
                </label>
              </div>
              <div className="application-list">
                {items
                  .filter(
                    (a) =>
                      filter === "all" ||
                      (filter === "pending"
                        ? pending.includes(a)
                        : filter === "active"
                          ? a.status === "Active"
                          : ["Repaid", "Rejected", "Declined"].includes(
                              a.status,
                            )),
                  )
                  .map((a) => (
                    <button
                      key={a.id}
                      className="application-row"
                      onClick={() => setSelected(a.id)}
                    >
                      <div>
                        <span className="eyebrow">
                          {a.invoiceNumber} ·{" "}
                          {user.role === "operator" ? a.businessName : a.payer}
                        </span>
                        <strong>{amount(a.amount)}</strong>
                        <span className="muted">
                          {a.termDays} days · Submitted{" "}
                          {shortDate(a.requestedAt)}
                        </span>
                      </div>
                      <div className="row-status">
                        <span className="status">
                          {a.status === "Active" && a.dueAt! < Date.now()
                            ? "Past due · simulated"
                            : labels[a.status]}
                        </span>
                        <span aria-hidden>↗</span>
                      </div>
                    </button>
                  ))}
                {!items.length && <div className="empty-state"><p>{user.role === "operator" ? "Your review queue is clear. New business applications will appear here." : "Your applications will appear here after you submit your first invoice."}</p></div>}
                {items.length > 0 &&
                  !items.some(
                    (a) =>
                      filter === "all" ||
                      (filter === "pending"
                        ? pending.includes(a)
                        : filter === "active"
                          ? a.status === "Active"
                          : ["Repaid", "Rejected", "Declined"].includes(
                              a.status,
                            )),
                  ) && (
                    <div className="empty-state">
                      No applications match this filter.
                    </div>
                  )}
              </div>
            </>
          )}
        </main>
      )}
      {!loading && (!user || (user.role === "borrower" && view === "list" && !current)) && (
        <section className="funding-preview" aria-labelledby="asset-funding-heading">
          <div>
            <span className="coming-soon-label">Coming soon</span>
            <h2 id="asset-funding-heading">Asset-backed funding</h2>
            <p>
              A planned path to funding above $5,000, backed by eligible tokens
              or tokenised real-world assets your business holds.
            </p>
          </div>
          <div className="funding-preview-details">
            <h3>What’s planned</h3>
            <ul>
              <li>An application to tell us about your business assets.</li>
              <li>One approved collateral type to start, with a funding partner.</li>
              <li>Clear valuation, custody, and recovery terms before any loan.</li>
            </ul>
            <p className="funding-preview-status">
              Applications are not open yet. Eligible assets, lending limits,
              and launch timing are still being determined.
            </p>
          </div>
        </section>
      )}
      <footer className="app-footer">
        <span>Float · Early access workspace</span>
        <span>
          Terms are proposed individually. Submitting an application does not
          guarantee funding.
        </span>
      </footer>
    </div>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong className="tabular">{value}</strong>
    </div>
  );
}
function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
function ApplicationDetail({
  application: a,
  user,
  busy,
  onBack,
  onAction,
}: {
  application: Application;
  user: User;
  busy: boolean;
  onBack: () => void;
  onAction: (name: string, body?: object) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [fee, setFee] = useState("250");
  const operator = user.role === "operator";
  return (
    <>
      <button className="text-button" onClick={onBack}>
        ← All applications
      </button>
      <div className="detail-heading">
        <div>
          <p className="eyebrow">
            {a.invoiceNumber} · {a.businessName}
          </p>
          <h2>{amount(a.amount)}</h2>
        </div>
        <span className="status">{labels[a.status]}</span>
      </div>
      <div className="detail-layout">
        <div className="panel">
          <h3>Invoice & request</h3>
          <dl className="detail-facts">
            <div>
              <dt>Customer</dt>
              <dd>{a.payer}</dd>
            </div>
            <div>
              <dt>Invoice amount</dt>
              <dd>{amount(a.expectedInflow)}</dd>
            </div>
            <div>
              <dt>Invoice due</dt>
              <dd>{shortDate(Date.parse(a.invoiceDue + "T12:00:00"))}</dd>
            </div>
            <div>
              <dt>Term</dt>
              <dd>{a.termDays} days from disbursement</dd>
            </div>
          </dl>
          <a
            className="document-link"
            href={`/api/applications/${a.id}/document`}
          >
            ↓ Download {a.documentName}
          </a>
          <h3 className="history-title">Application history</h3>
          <ol className="timeline">
            {a.events.map((e, i) => (
              <li key={i}>
                <span>
                  {e.actor} · {new Date(e.at).toLocaleString()}
                </span>
                <p>{e.message}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="panel terms-panel">
          <p className="eyebrow">
            {a.status === "Requested" ? "Review" : "Financing terms"}
          </p>
          <h3>
            {a.status === "Offered" ? "Your offer is ready" : labels[a.status]}
          </h3>
          {["Offered", "Accepted", "Active", "Repaid", "Declined"].includes(
            a.status,
          ) && (
            <>
              <dl className="detail-facts terms">
                <div>
                  <dt>You receive</dt>
                  <dd>{amount(a.amount)}</dd>
                </div>
                <div>
                  <dt>One-time fee ({a.feeBps / 100}%)</dt>
                  <dd>{amount(a.totalDue - a.amount)}</dd>
                </div>
                <div className="total">
                  <dt>Total repayment</dt>
                  <dd>{amount(a.totalDue)}</dd>
                </div>
                <div>
                  <dt>Repayment due</dt>
                  <dd>
                    {a.dueAt
                      ? shortDate(a.dueAt)
                      : `${a.termDays} days after disbursement`}
                  </dd>
                </div>
              </dl>
              <p className="muted">
                Test offer. Accepting does not move money or create a funded
                loan.
              </p>
            </>
          )}
          {!operator && a.status === "Offered" && (
            <div className="action-stack">
              <button
                className="primary"
                disabled={busy}
                onClick={() => void onAction("accept")}
              >
                Accept test offer
              </button>
              <button
                className="secondary"
                disabled={busy}
                onClick={() => void onAction("decline")}
              >
                Decline offer
              </button>
            </div>
          )}
          {!operator && a.status === "Active" && (
            <button
              className="primary"
              disabled={busy}
              onClick={() => void onAction("repay")}
            >
              Simulate full repayment
            </button>
          )}
          {!operator && a.status === "Accepted" && (
            <p>
              Float can now record a simulated disbursement. Your repayment date
              will appear here.
            </p>
          )}
          {operator && a.status === "Accepted" && (
            <button
              className="primary"
              disabled={busy}
              onClick={() => void onAction("fund")}
            >
              Simulate disbursement
            </button>
          )}
          {operator && ["Requested", "NeedsInformation"].includes(a.status) && (
            <div className="action-stack">
              <Field
                label="Review note / information needed"
                hint="This message is visible to the applicant."
              >
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={2000}
                  rows={4}
                />
              </Field>
              {a.status === "Requested" && (
                <>
                  <Field label="One-time fee (%)">
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.01"
                      value={Number(fee) / 100}
                      onChange={(e) =>
                        setFee(String(Math.round(Number(e.target.value) * 100)))
                      }
                    />
                  </Field>
                  <p className="offer-preview">
                    Proposed total:{" "}
                    <strong>
                      {amount(a.amount * (1 + Number(fee) / 10000))}
                    </strong>
                  </p>
                  <button
                    className="primary"
                    disabled={busy || !note.trim()}
                    onClick={() =>
                      void onAction("offer", { feeBps: Number(fee), note })
                    }
                  >
                    Send test offer
                  </button>
                  <button
                    className="secondary"
                    disabled={busy || !note.trim()}
                    onClick={() => void onAction("information", { note })}
                  >
                    Request information
                  </button>
                </>
              )}
              <button
                className="text-button"
                disabled={busy || !note.trim()}
                onClick={() => void onAction("reject", { note })}
              >
                Decline application
              </button>
            </div>
          )}
          {!operator && a.status === "NeedsInformation" && (
            <div className="action-stack">
              <p>
                Read the latest request in your application history, then
                respond below.
              </p>
              <Field label="Your response">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  maxLength={2000}
                />
              </Field>
              <button
                className="primary"
                disabled={busy || !note.trim()}
                onClick={() => void onAction("respond", { note })}
              >
                Send response
              </button>
            </div>
          )}
          {!operator && a.status === "Requested" && (
            <p>
              Your application is awaiting review. Any offer or request for
              information will appear here.
            </p>
          )}
          {busy && <p role="status">Saving…</p>}
        </div>
      </div>
    </>
  );
}
