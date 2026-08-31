import { useCallback, useEffect, useMemo, useState } from "react";
import { Advance, Business, POLICY, STATUS_COPY, daysUntil, shortDate, usd } from "./lib/domain";
import { DemoLedger, Ledger } from "./lib/ledger";

type Tab = "apply" | "advances" | "underwriting" | "record";

export default function App() {
  const ledger: Ledger = useMemo(() => new DemoLedger(), []);
  const [tab, setTab] = useState<Tab>("apply");
  const [business, setBusiness] = useState<Business | null>(null);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setBusiness(await ledger.getBusiness());
    setAdvances(await ledger.listAdvances());
  }, [ledger]);

  useEffect(() => { void refresh(); }, [refresh]);

  const pending = advances.filter((a) => a.status === "Requested").length;

  return (
    <div className="min-h-full flex flex-col">
      <Header mode={ledger.mode} />

      <nav className="border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="mx-auto max-w-6xl px-8 flex gap-8">
          <TabButton active={tab === "apply"} onClick={() => setTab("apply")}>Request an advance</TabButton>
          <TabButton active={tab === "advances"} onClick={() => setTab("advances")}>Your advances</TabButton>
          <TabButton active={tab === "underwriting"} onClick={() => setTab("underwriting")}>
            Underwriting{pending > 0 ? ` (${pending})` : ""}
          </TabButton>
          <TabButton active={tab === "record"} onClick={() => setTab("record")}>Credit record</TabButton>
        </div>
      </nav>

      {notice && (
        <div className="mx-auto max-w-6xl w-full px-8 pt-6">
          <div className="settle rounded-[10px] px-4 py-3 text-sm border"
               style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
            {notice}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl w-full px-8 py-10 flex-1">
        {tab === "apply" && (
          <ApplyScreen
            ledger={ledger}
            onDone={async (msg) => { setNotice(msg); await refresh(); setTab("advances"); }}
            onError={setNotice}
          />
        )}
        {tab === "advances" && (
          <AdvancesScreen
            advances={advances}
            onRepay={async (id) => {
              try {
                const a = await ledger.repay(id);
                setNotice(`Repaid ${usd(a.totalDue)}. Recorded against your credit history.`);
                await refresh();
              } catch (e) { setNotice((e as Error).message); }
            }}
          />
        )}
        {tab === "underwriting" && (
          <UnderwritingScreen
            advances={advances}
            onApprove={async (id, feeBps) => {
              try {
                const a = await ledger.approveAndDisburse(id, feeBps);
                setNotice(`Approved. ${usd(a.amount)} USDC disbursed — repayment of ${usd(a.totalDue)} due ${shortDate(a.dueAt!)}.`);
                await refresh();
              } catch (e) { setNotice((e as Error).message); }
            }}
          />
        )}
        {tab === "record" && business && <RecordScreen business={business} advances={advances} />}
      </main>

      <footer className="border-t py-6" style={{ borderColor: "var(--color-divider)" }}>
        <div className="mx-auto max-w-6xl px-8 text-xs" style={{ color: "var(--color-grey)" }}>
          Float · Solana devnet · advances are bounded in code: tier 1 ceiling{" "}
          <span className="tabular">{usd(POLICY.MAX_ADVANCE_TIER_1)}</span>, term{" "}
          <span className="tabular">{POLICY.MIN_TERM_DAYS}–{POLICY.MAX_TERM_DAYS}</span> days.
        </div>
      </footer>
    </div>
  );
}

/* ── chrome ─────────────────────────────────────────────────────────────── */

function Header({ mode }: { mode: "demo" | "devnet" }) {
  return (
    <header style={{ background: "var(--color-navy)" }} className="text-white">
      <div className="mx-auto max-w-6xl px-8 py-5 flex items-baseline justify-between">
        <div className="flex items-baseline gap-3">
          <span className="display text-2xl lowercase">float</span>
          <span className="text-sm" style={{ color: "var(--color-grey)" }}>
            working capital for businesses waiting to be paid
          </span>
        </div>
        <span className="text-xs uppercase tracking-wider" style={{ color: "var(--color-grey)" }}>
          {mode === "demo" ? "Demo data" : "Devnet"}
        </span>
      </div>
    </header>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="py-4 text-sm transition-colors duration-150"
      style={{
        color: active ? "var(--color-navy)" : "var(--color-grey)",
        fontWeight: active ? 600 : 400,
        boxShadow: active ? "inset 0 -2px 0 var(--color-navy)" : "none",
      }}
    >
      {children}
    </button>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm mb-2" style={{ fontWeight: 500 }}>{label}</span>
      {children}
      {hint && <span className="block text-xs mt-2" style={{ color: "var(--color-grey)" }}>{hint}</span>}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm)",
  padding: "10px 12px",
  width: "100%",
  fontFamily: "inherit",
  fontSize: "15px",
  color: "var(--color-navy)",
  background: "var(--color-white)",
};

function PrimaryButton({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className="px-5 py-3 text-sm transition-opacity duration-150 disabled:opacity-40"
      style={{ background: "var(--color-black)", color: "var(--color-white)", borderRadius: "var(--radius-sm)", fontWeight: 500 }}
    >
      {children}
    </button>
  );
}

/** The status system. No colour carries meaning — the words do. */
function StatusLabel({ advance }: { advance: Advance }) {
  const copy = STATUS_COPY[advance.status];
  const overdueSoon =
    advance.status === "Active" && advance.dueAt !== null && daysUntil(advance.dueAt) <= 3;
  return (
    <div>
      <div style={{ fontWeight: 600 }}>{copy.label}</div>
      <div className="text-xs mt-1" style={{ color: "var(--color-grey)" }}>
        {copy.detail}
        {overdueSoon && advance.dueAt !== null && (
          <> <strong style={{ color: "var(--color-navy)" }}>Due in {daysUntil(advance.dueAt)} days.</strong></>
        )}
      </div>
    </div>
  );
}

/* ── screens ────────────────────────────────────────────────────────────── */

function ApplyScreen({ ledger, onDone, onError }: {
  ledger: Ledger; onDone: (msg: string) => void; onError: (msg: string) => void;
}) {
  const [amount, setAmount] = useState("2500");
  const [inflow, setInflow] = useState("9000");
  const [payer, setPayer] = useState("Northwind Logistics Ltd");
  const [term, setTerm] = useState("30");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await ledger.requestAdvance({
        amount: Number(amount), expectedInflow: Number(inflow), payer, termDays: Number(term),
      });
      onDone("Request submitted. It is now in the underwriting queue.");
    } catch (err) { onError((err as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="grid grid-cols-[1fr_320px] gap-16 settle">
      <div>
        <h1 className="display text-3xl mb-2">Request an advance</h1>
        <p className="text-sm mb-8" style={{ color: "var(--color-grey)" }}>
          Against a payment already owed to you. We verify the payer independently before funding.
        </p>
        <form onSubmit={submit} className="grid gap-6 max-w-lg">
          <Field label="Who owes you the money?" hint="We confirm the obligation with them directly — not through you.">
            <input style={inputStyle} value={payer} onChange={(e) => setPayer(e.target.value)} required />
          </Field>
          <Field label="Amount they owe (USDC)" hint="Your advance cannot exceed this figure.">
            <input style={inputStyle} className="tabular" type="number" value={inflow}
                   onChange={(e) => setInflow(e.target.value)} min={1} required />
          </Field>
          <Field label="Advance requested (USDC)"
                 hint={`Tier 1 ceiling is ${usd(POLICY.MAX_ADVANCE_TIER_1)} without a pledge.`}>
            <input style={inputStyle} className="tabular" type="number" value={amount}
                   onChange={(e) => setAmount(e.target.value)} min={1} required />
          </Field>
          <Field label="Term (days)" hint={`${POLICY.MIN_TERM_DAYS}–${POLICY.MAX_TERM_DAYS} days.`}>
            <input style={inputStyle} className="tabular" type="number" value={term}
                   onChange={(e) => setTerm(e.target.value)} min={POLICY.MIN_TERM_DAYS} max={POLICY.MAX_TERM_DAYS} required />
          </Field>
          <div><PrimaryButton disabled={busy}>{busy ? "Submitting…" : "Submit request"}</PrimaryButton></div>
        </form>
      </div>
      <aside className="text-sm border-l pl-8" style={{ borderColor: "var(--color-divider)" }}>
        <h2 className="mb-4" style={{ fontWeight: 600 }}>What we check</h2>
        <ol className="grid gap-4" style={{ color: "var(--color-grey)" }}>
          <li><strong style={{ color: "var(--color-navy)" }}>1. The payer is real.</strong> Verified against the register, independently of you.</li>
          <li><strong style={{ color: "var(--color-navy)" }}>2. The obligation exists.</strong> Confirmed with the payer, on a channel we source.</li>
          <li><strong style={{ color: "var(--color-navy)" }}>3. It is not financed twice.</strong> Checked against every invoice we have seen.</li>
          <li><strong style={{ color: "var(--color-navy)" }}>4. The advance fits the inflow.</strong> Enforced in the contract, not by policy.</li>
        </ol>
      </aside>
    </div>
  );
}

function AdvancesScreen({ advances, onRepay }: { advances: Advance[]; onRepay: (id: string) => void }) {
  if (advances.length === 0) return <Empty>No advances yet.</Empty>;
  return (
    <div className="settle">
      <h1 className="display text-3xl mb-8">Your advances</h1>
      <div className="grid gap-4">
        {advances.map((a) => (
          <article key={a.id} className="border p-6 grid grid-cols-[1fr_200px_200px] gap-8 items-center"
                   style={{ borderColor: "var(--color-border)", borderRadius: "var(--radius-md)" }}>
            <div>
              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-grey)" }}>
                {a.id} · against {a.payer}
              </div>
              <StatusLabel advance={a} />
            </div>
            <div className="tabular">
              <div className="text-2xl display">{usd(a.amount)}</div>
              <div className="text-xs mt-1" style={{ color: "var(--color-grey)" }}>
                {a.totalDue > 0 ? <>repay {usd(a.totalDue)}</> : <>fee set at approval</>}
              </div>
            </div>
            <div className="text-right">
              {a.dueAt && (
                <div className="text-xs tabular mb-3" style={{ color: "var(--color-grey)" }}>
                  Due {shortDate(a.dueAt)}
                </div>
              )}
              {(a.status === "Active" || a.status === "Overdue") && (
                <PrimaryButton onClick={() => onRepay(a.id)}>Repay {usd(a.totalDue)}</PrimaryButton>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function UnderwritingScreen({ advances, onApprove }: {
  advances: Advance[]; onApprove: (id: string, feeBps: number) => void;
}) {
  const queue = advances.filter((a) => a.status === "Requested");
  return (
    <div className="settle">
      <h1 className="display text-3xl mb-2">Underwriting queue</h1>
      <p className="text-sm mb-8" style={{ color: "var(--color-grey)" }}>
        Approval disburses USDC immediately. The contract rejects anything above the tier-1 ceiling
        or above the verified inflow, whatever is entered here.
      </p>
      {queue.length === 0 ? <Empty>Nothing awaiting review.</Empty> : (
        <div className="grid gap-4">
          {queue.map((a) => <QueueRow key={a.id} advance={a} onApprove={onApprove} />)}
        </div>
      )}
    </div>
  );
}

function QueueRow({ advance, onApprove }: { advance: Advance; onApprove: (id: string, feeBps: number) => void }) {
  const [feeBps, setFeeBps] = useState("250");
  const coverage = advance.expectedInflow > 0 ? advance.amount / advance.expectedInflow : 0;
  return (
    <article className="border p-6" style={{ borderColor: "var(--color-border)", borderRadius: "var(--radius-md)" }}>
      <div className="grid grid-cols-[1fr_auto] gap-8 items-start">
        <div>
          <div className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--color-grey)" }}>{advance.id}</div>
          <div className="text-lg mb-4" style={{ fontWeight: 600 }}>{advance.businessName}</div>
          <dl className="grid grid-cols-4 gap-6 text-sm">
            <Stat label="Advance" value={usd(advance.amount)} />
            <Stat label="Owed by payer" value={usd(advance.expectedInflow)} />
            <Stat label="Coverage" value={`${Math.round(coverage * 100)}%`} />
            <Stat label="Term" value={`${advance.termDays} days`} />
          </dl>
          <div className="text-sm mt-4" style={{ color: "var(--color-grey)" }}>
            Payer: <span style={{ color: "var(--color-navy)" }}>{advance.payer}</span>
          </div>
        </div>
        <div className="grid gap-3 w-56">
          <Field label="Fee (bps)" hint={`Maximum ${POLICY.MAX_FEE_BPS} bps.`}>
            <input style={inputStyle} className="tabular" type="number" value={feeBps}
                   onChange={(e) => setFeeBps(e.target.value)} min={0} max={POLICY.MAX_FEE_BPS} />
          </Field>
          <PrimaryButton onClick={() => onApprove(advance.id, Number(feeBps))}>
            Approve and disburse
          </PrimaryButton>
        </div>
      </div>
    </article>
  );
}

function RecordScreen({ business, advances }: { business: Business; advances: Advance[] }) {
  const settled = advances.filter((a) => a.status === "Repaid");
  return (
    <div className="settle">
      <h1 className="display text-3xl mb-2">Credit record</h1>
      <p className="text-sm mb-8 max-w-2xl" style={{ color: "var(--color-grey)" }}>
        Written by the contract on every repayment, and readable by anyone. It moves your price
        and your speed. It does not raise your ceiling — that is bounded by verified inflow, so
        no repayment history can inflate it.
      </p>
      <div className="border p-8 mb-8" style={{ borderColor: "var(--color-border)", borderRadius: "var(--radius-md)" }}>
        <div className="text-xl mb-6" style={{ fontWeight: 600 }}>{business.legalName}</div>
        <dl className="grid grid-cols-4 gap-8">
          <Stat large label="Advances taken" value={String(business.advancesTaken)} />
          <Stat large label="Repaid in full" value={String(business.advancesRepaid)} />
          <Stat large label="Ever past due" value={String(business.advancesOverdue)} />
          <Stat large label="Volume repaid" value={usd(business.totalVolumeRepaid)} />
        </dl>
        <div className="text-xs mt-6 tabular" style={{ color: "var(--color-grey)" }}>
          Registered {shortDate(business.registeredAt)}
        </div>
      </div>
      <h2 className="text-sm uppercase tracking-wider mb-4" style={{ color: "var(--color-grey)" }}>Settled advances</h2>
      {settled.length === 0 ? <Empty>Nothing settled yet.</Empty> : (
        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: "var(--color-grey)" }} className="text-left">
              <th className="py-2 font-medium">Reference</th>
              <th className="py-2 font-medium">Payer</th>
              <th className="py-2 font-medium text-right">Advance</th>
              <th className="py-2 font-medium text-right">Repaid</th>
              <th className="py-2 font-medium text-right">Due date</th>
            </tr>
          </thead>
          <tbody>
            {settled.map((a) => (
              <tr key={a.id} className="border-t" style={{ borderColor: "var(--color-divider)" }}>
                <td className="py-3">{a.id}</td>
                <td className="py-3">{a.payer}</td>
                <td className="py-3 text-right tabular">{usd(a.amount)}</td>
                <td className="py-3 text-right tabular">{usd(a.totalDue)}</td>
                <td className="py-3 text-right tabular">{a.dueAt ? shortDate(a.dueAt) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Stat({ label, value, large }: { label: string; value: string; large?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-grey)" }}>{label}</dt>
      <dd className={`tabular ${large ? "text-2xl display" : ""}`} style={{ fontWeight: large ? 600 : 500 }}>{value}</dd>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-dashed p-12 text-center text-sm"
         style={{ borderColor: "var(--color-border)", borderRadius: "var(--radius-md)", color: "var(--color-grey)" }}>
      {children}
    </div>
  );
}
