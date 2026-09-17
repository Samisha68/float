import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  BASE_MARGIN,
  COUNTRIES,
  MAX_AMOUNT,
  MIN_AMOUNT,
  PAYMENT_KINDS,
  RECORD_STEPS,
  TERMS,
  addDays,
  advanceTo,
  checkBusiness,
  checkRequest,
  date,
  daysBetween,
  dueDate,
  initial,
  isFunded,
  isoDate,
  marginRequired,
  money,
  nextStep,
  quote,
  repayments,
  respond,
  sampleDocuments,
  sampleEvidence,
  seasoned,
  stageLabel,
  stages,
  startAgain,
  type Business,
  type Errors,
  type Request,
  type Stage,
  type State,
} from "./lib/prototype";
import "./prototype.css";

const STORAGE_KEY = "float-prototype-v2";
const TABS = ["Dashboard", "Your record", "Business", "Settings"] as const;
type Tab = (typeof TABS)[number];

function load(): State {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as State | null;
    if (!saved || !stages.includes(saved.stage)) return initial();
    return { ...initial(), ...saved, business: { ...initial().business, ...saved.business } };
  } catch {
    return initial();
  }
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="fp-field">
      <span className="fp-label">{label}</span>
      {children}
      {hint && !error ? <small className="fp-hint">{hint}</small> : null}
      {error ? <small className="fp-error">{error}</small> : null}
    </label>
  );
}

function Rows({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="fp-rows">
      {items.map(([term, value]) => (
        <div key={term}>
          <dt>{term}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Upload({
  label,
  files,
  error,
  sample,
  onChange,
}: {
  label: string;
  files: string[];
  error?: string;
  sample: string[];
  onChange: (files: string[]) => void;
}) {
  const [problem, setProblem] = useState("");

  const add = (list: FileList | null) => {
    const picked = Array.from(list || []);
    const bad = picked.find((file) => file.size > 10 * 1024 * 1024 || !/\.(pdf|png|jpe?g)$/i.test(file.name));
    if (bad) {
      setProblem("Use PDF, PNG or JPG files under 10 MB.");
      return;
    }
    setProblem("");
    onChange([...new Set([...files, ...picked.map((file) => file.name)])]);
  };

  return (
    <div className="fp-upload">
      <div className="fp-upload-head">
        <span className="fp-label">{label}</span>
        <button type="button" className="fp-link" onClick={() => onChange(sample)}>
          Use sample files
        </button>
      </div>
      <input type="file" aria-label={label} multiple accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => add(e.target.files)} />
      {files.map((file) => (
        <div className="fp-file" key={file}>
          <span>{file}</span>
          <button type="button" aria-label={`Remove ${file}`} onClick={() => onChange(files.filter((f) => f !== file))}>
            Remove
          </button>
        </div>
      ))}
      <small className="fp-hint">Files stay on your device. Only the names are saved.</small>
      {problem ? <small className="fp-error">{problem}</small> : null}
      {error && !problem ? <small className="fp-error">{error}</small> : null}
    </div>
  );
}

export default function Prototype() {
  const [state, setState] = useState<State>(load);
  const [tab, setTab] = useState<Tab>("Dashboard");
  const [errors, setErrors] = useState<Errors>({});
  const [reply, setReply] = useState("");
  const [toast, setToast] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);

  const record = repayments(state);
  /* What a new request would cost today. */
  const live = quote(state.request.amount, state.request.days, record);
  /* What this advance actually costs: the price agreed at approval. */
  const terms = state.agreed ?? live;
  const due = dueDate(state);
  const funded = isFunded(state);
  const editing = state.stage === "draft" && state.started;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* Saving is a convenience, not a requirement. */
    }
  }, [state]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    heading.current?.focus();
  }, [state.step, state.stage, tab]);

  const setBusiness = (patch: Partial<Business>) =>
    setState((prev) => ({ ...prev, business: { ...prev.business, ...patch } }));
  const setRequest = (patch: Partial<Request>) =>
    setState((prev) => ({ ...prev, request: { ...prev.request, ...patch } }));

  const move = (stage: Stage, message: string) => {
    setState((prev) => advanceTo(prev, stage));
    setErrors({});
    setToast(message);
  };

  if (!state.started) {
    return (
      <div className="fp">
        <header className="fp-landing-head">
          <span className="fp-brand">
            <img src="/float-logo.svg" alt="Float" />
          </span>
          <span className="fp-pill">Prototype · no real funds</span>
        </header>
        <main className="fp-landing">
          <p className="fp-eyebrow">Working capital, on your record</p>
          <h1>
            your money is already yours.
            <br />
            you just can’t reach it yet.
          </h1>
          <p className="fp-lede">
            Float advances USDC against money that is already coming to your business, and the repayment record you
            build is yours to take anywhere.
          </p>
          <button className="fp-button" onClick={() => setState((prev) => ({ ...prev, started: true }))}>
            Start an application
          </button>
          <ol className="fp-landing-steps">
            <li>
              <strong>Tell us once</strong>
              <span>Your business, and the payment you’re waiting on.</span>
            </li>
            <li>
              <strong>See the price first</strong>
              <span>One fee, the repayment date, no surprises later.</span>
            </li>
            <li>
              <strong>Repay, and keep the record</strong>
              <span>Each repayment lowers what your next advance costs.</span>
            </li>
          </ol>
          <p className="fp-fineprint">A prototype. Nothing here moves real money, and no financing is promised.</p>
        </main>
      </div>
    );
  }

  const quoteCard = (
    <section className="fp-card fp-quote" aria-label="Your price">
      <p className="fp-eyebrow">What this costs</p>
      <Rows
        items={[
          ["You receive", money(state.request.amount)],
          ["Term", `${state.request.days} days`],
          ["Fee", `${live.rate}% · ${money(live.fee)}`],
          ["You repay", <strong key="total">{money(live.total)}</strong>],
          ["Repayment date", date(addDays(isoDate(), state.request.days))],
        ]}
      />
      {live.discount > 0 ? (
        <p className="fp-note">
          Your record took {live.discount} points off this fee. A new business pays {live.base}%.
        </p>
      ) : (
        <p className="fp-note">Repay on time and your next advance costs less. The amount stays tied to what’s coming in.</p>
      )}
    </section>
  );

  const submitStep = () => {
    if (state.step === 0) {
      const found = checkBusiness(state.business, state.documents);
      setErrors(found);
      if (Object.keys(found).length) return;
      setState((prev) => ({ ...prev, step: 1 }));
      return;
    }
    if (state.step === 1) {
      const found = checkRequest(state.request, state.evidence);
      setErrors(found);
      if (Object.keys(found).length) return;
      setState((prev) => ({ ...prev, step: 2 }));
      return;
    }
    move("requested", "Application sent. We’ll come back with a decision.");
    setTab("Dashboard");
  };

  const wizard = (
    <>
      <ol className="fp-steps">
        {["Your business", "What’s coming in", "Check and send"].map((label, index) => (
          <li key={label} aria-current={state.step === index ? "step" : undefined}>
            <span>{state.step > index ? "Done" : index + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      <div className="fp-grid">
        <form
          className="fp-card"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            submitStep();
          }}
        >
          {state.step === 0 ? (
            <>
              <h2>Tell us about your business</h2>
              <p>Four details and one document. You only do this once.</p>
              <div className="fp-form-grid">
                <Field label="Business name" error={errors.name}>
                  <input value={state.business.name} onChange={(e) => setBusiness({ name: e.target.value })} />
                </Field>
                <Field label="Country" error={errors.country}>
                  <select value={state.business.country} onChange={(e) => setBusiness({ country: e.target.value })}>
                    {COUNTRIES.map((country) => (
                      <option key={country}>{country}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Your name" error={errors.representative}>
                  <input
                    value={state.business.representative}
                    onChange={(e) => setBusiness({ representative: e.target.value })}
                  />
                </Field>
                <Field label="Work email" error={errors.email}>
                  <input type="email" value={state.business.email} onChange={(e) => setBusiness({ email: e.target.value })} />
                </Field>
              </div>
              <Upload
                label="Proof your business exists"
                files={state.documents}
                error={errors.documents}
                sample={sampleDocuments}
                onChange={(documents) => setState((prev) => ({ ...prev, documents }))}
              />
            </>
          ) : null}

          {state.step === 1 ? (
            <>
              <h2>What’s coming in</h2>
              <p>We lend against money you are already owed, so this part decides everything.</p>
              <div className="fp-form-grid">
                <Field label="Who owes you" error={errors.payer}>
                  <input value={state.request.payer} onChange={(e) => setRequest({ payer: e.target.value })} />
                </Field>
                <Field label="Type of payment">
                  <select value={state.request.kind} onChange={(e) => setRequest({ kind: e.target.value })}>
                    {PAYMENT_KINDS.map((kind) => (
                      <option key={kind}>{kind}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Amount owed to you" error={errors.incoming}>
                  <input
                    type="number"
                    min={0}
                    value={state.request.incoming || ""}
                    onChange={(e) => setRequest({ incoming: Number(e.target.value) })}
                  />
                </Field>
                <Field label="When you expect it" error={errors.expected}>
                  <input
                    type="date"
                    min={isoDate()}
                    value={state.request.expected}
                    onChange={(e) => setRequest({ expected: e.target.value })}
                  />
                </Field>
              </div>
              <Upload
                label="The invoice or agreement"
                files={state.evidence}
                error={errors.evidence}
                sample={sampleEvidence}
                onChange={(evidence) => setState((prev) => ({ ...prev, evidence }))}
              />

              <hr />

              <h2>How much do you need now</h2>
              <p>Up to the amount that’s coming in, for as long as you need it.</p>
              <div className="fp-field">
                <label className="fp-label" htmlFor="fp-amount">
                  Amount
                </label>
                <input
                  id="fp-amount"
                  className="fp-amount"
                  type="number"
                  min={MIN_AMOUNT}
                  max={MAX_AMOUNT}
                  step={100}
                  value={state.request.amount}
                  onChange={(e) => setRequest({ amount: Number(e.target.value) })}
                />
                <input
                  className="fp-slider"
                  type="range"
                  aria-label="Amount slider"
                  min={MIN_AMOUNT}
                  max={MAX_AMOUNT}
                  step={100}
                  value={state.request.amount}
                  onChange={(e) => setRequest({ amount: Number(e.target.value) })}
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
                      aria-pressed={state.request.days === days}
                      onClick={() => setRequest({ days })}
                    >
                      {days} days
                    </button>
                  ))}
                </div>
                {errors.days ? <small className="fp-error">{errors.days}</small> : null}
              </fieldset>
            </>
          ) : null}

          {state.step === 2 ? (
            <>
              <h2>Check this over</h2>
              <p>Everything we’ll use to make the decision. Change anything that isn’t right.</p>
              <Rows
                items={[
                  ["Business", state.business.name],
                  ["Country", state.business.country],
                  ["Contact", `${state.business.representative} · ${state.business.email}`],
                  ["Coming in", `${money(state.request.incoming)} from ${state.request.payer}`],
                  ["Expected", date(state.request.expected)],
                  ["You’re asking for", money(state.request.amount)],
                  ["Term", `${state.request.days} days`],
                  ["Documents", [...state.documents, ...state.evidence].join(", ")],
                ]}
              />
              <div className="fp-inline-actions">
                <button type="button" className="fp-link" onClick={() => setState((prev) => ({ ...prev, step: 0 }))}>
                  Change business details
                </button>
                <button type="button" className="fp-link" onClick={() => setState((prev) => ({ ...prev, step: 1 }))}>
                  Change the request
                </button>
              </div>
            </>
          ) : null}

          <div className="fp-actions">
            {state.step > 0 ? (
              <button type="button" className="fp-secondary" onClick={() => setState((prev) => ({ ...prev, step: prev.step - 1 }))}>
                Back
              </button>
            ) : (
              <span />
            )}
            <button className="fp-button">{state.step === 2 ? "Send application" : "Continue"}</button>
          </div>
        </form>

        <aside>{quoteCard}</aside>
      </div>
    </>
  );

  const dashboard = (
    <>
      {funded ? (
        <div className="fp-metrics">
          <div>
            <span>In your wallet</span>
            <strong>{money(state.stage === "active" ? state.request.amount : 0)}</strong>
            <p>{state.stage === "active" ? "Ready to spend" : "Advance settled"}</p>
          </div>
          <div>
            <span>You owe</span>
            <strong>{money(state.stage === "active" ? terms.total : 0)}</strong>
            <p>{state.stage === "active" ? `Due ${date(due)}` : "Nothing outstanding"}</p>
          </div>
          <div>
            <span>Repayments on record</span>
            <strong>{record}</strong>
            <p>{record ? "Priced into your next advance" : "Your record starts here"}</p>
          </div>
        </div>
      ) : null}

      <section className="fp-card">
        <div className="fp-card-head">
          <p className="fp-eyebrow">Advance FL-0001</p>
          <span className="fp-pill">{stageLabel[state.stage]}</span>
        </div>

        {state.stage === "requested" ? (
          <>
            <h2>We’re looking at it now</h2>
            <p>
              We’re checking {state.business.name} and the {money(state.request.incoming)} coming from {state.request.payer}.
            </p>
            <ol className="fp-timeline">
              {["Application received", "Business checked", "Incoming payment checked", "Decision"].map((label, index) => (
                <li key={label}>
                  <span>{index < 2 ? "Done" : index + 1}</span>
                  <div>
                    {label}
                    <small>{index < 2 ? "Complete" : index === 2 ? "Happening now" : "Next"}</small>
                  </div>
                </li>
              ))}
            </ol>
            <div className="fp-actions fp-actions-start">
              <button className="fp-button" onClick={() => move("offered", "Approved. Your offer is ready.")}>
                Skip the wait and see the decision
              </button>
              <button className="fp-secondary" onClick={() => move("information", "Float asked for one more thing.")}>
                Show an information request
              </button>
            </div>
            <small className="fp-hint">Demo steps. A real decision takes hours, not a click.</small>
          </>
        ) : null}

        {state.stage === "information" ? (
          <>
            <h2>We need one more thing</h2>
            <p>{state.note}</p>
            <Field label="Your reply" error={errors.reply}>
              <textarea
                rows={4}
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder="Tell us what you’re sending, or explain the gap."
              />
            </Field>
            <Upload
              label="Anything else that helps"
              files={state.evidence}
              sample={sampleEvidence}
              onChange={(evidence) => setState((prev) => ({ ...prev, evidence }))}
            />
            <div className="fp-actions fp-actions-start">
              <button
                className="fp-button"
                onClick={() => {
                  if (!reply.trim()) {
                    setErrors({ reply: "Write a line so we know what changed." });
                    return;
                  }
                  setState((prev) => respond(prev, reply.trim()));
                  setReply("");
                  setErrors({});
                  setToast("Sent. Your application is back with us.");
                }}
              >
                Send reply
              </button>
            </div>
            <small className="fp-hint">Your advance isn’t cancelled. It goes back in the queue.</small>
          </>
        ) : null}

        {state.stage === "rejected" ? (
          <>
            <h2>We couldn’t approve this one</h2>
            <p>{state.note}</p>
            <p>
              Nothing about this stops you applying again with a different payment. It doesn’t touch your record, and we
              didn’t keep anything you’ll have to redo.
            </p>
            <div className="fp-actions fp-actions-start">
              <button
                className="fp-button"
                onClick={() => {
                  setState((prev) => startAgain(prev));
                  setToast("Start a new request. Your business details are still here.");
                }}
              >
                Try a different payment
              </button>
            </div>
          </>
        ) : null}

        {state.stage === "offered" ? (
          <>
            <h2>Approved. Here are the terms.</h2>
            <p>Nothing moves until you accept.</p>
            <Rows
              items={[
                ["You receive", <strong key="a">{money(state.request.amount)}</strong>],
                ["Fee", `${terms.rate}% · ${money(terms.fee)}`],
                ["You repay", money(terms.total)],
                ["Repayment date", date(addDays(isoDate(), state.request.days))],
              ]}
            />
            <div className="fp-actions fp-actions-start">
              <button className="fp-button" onClick={() => move("accepted", "Accepted. We’re sending the funds.")}>
                Accept these terms
              </button>
              <button className="fp-secondary" onClick={() => move("declined", "Offer declined. Nothing was charged.")}>
                Decline
              </button>
            </div>
          </>
        ) : null}

        {state.stage === "accepted" ? (
          <>
            <h2>Accepted. The money is on its way.</h2>
            <p>
              We’re sending {money(state.request.amount)} to your wallet. Repayment of {money(terms.total)} is due{" "}
              {state.request.days} days after it lands, not from today.
            </p>
            <Rows
              items={[
                ["You accepted", `${money(state.request.amount)} at ${terms.rate}%`],
                ["You’ll repay", money(terms.total)],
                ["Waiting on", "Float to release the funds"],
              ]}
            />
            <button className="fp-button" onClick={() => move("active", `${money(state.request.amount)} is in your wallet.`)}>
              Skip the wait and receive the funds
            </button>
            <small className="fp-hint">Demo step. No money moves.</small>
          </>
        ) : null}

        {state.stage === "declined" ? (
          <>
            <h2>You declined this offer</h2>
            <p>Nothing was charged and nothing was recorded against you. The terms are here if you change your mind.</p>
            <Rows
              items={[
                ["Offered", money(state.request.amount)],
                ["At", `${terms.rate}% · ${money(terms.fee)}`],
              ]}
            />
            <div className="fp-actions fp-actions-start">
              <button className="fp-button" onClick={() => move("offered", "The offer is open again.")}>
                Look at it again
              </button>
              <button
                className="fp-secondary"
                onClick={() => {
                  setState((prev) => startAgain(prev));
                  setToast("Start a new request. Your business details are still here.");
                }}
              >
                Ask for something different
              </button>
            </div>
          </>
        ) : null}

        {state.stage === "active" ? (
          <>
            <h2>Your advance is running</h2>
            <p>
              {money(terms.total)} is due on {date(due)}, {Math.max(daysBetween(isoDate(), due), 0)} days from now.
            </p>
            <Rows
              items={[
                ["Advanced", money(state.request.amount)],
                ["Fee", money(terms.fee)],
                ["Total due", <strong key="t">{money(terms.total)}</strong>],
                ["Covered by", `${money(state.request.incoming)} from ${state.request.payer}`],
              ]}
            />
            <button className="fp-button" onClick={() => move("repaid", "Repaid. That’s one more on your record.")}>
              Repay {money(terms.total)}
            </button>
            <small className="fp-hint">Demo step. No money moves.</small>
          </>
        ) : null}

        {state.stage === "repaid" ? (
          <>
            <h2>Repaid, and your record grew</h2>
            <p>
              You repaid {money(terms.total)} and kept working through the gap. That’s {record}{" "}
              {record === 1 ? "repayment" : "repayments"} on your record now.
            </p>
            <Rows
              items={[
                ["You paid this time", `${terms.rate}% · ${money(terms.fee)}`],
                ["Your next advance", `${live.rate}% · ${money(live.fee)}`],
                ["Collateral margin earned", `${BASE_MARGIN - marginRequired(record)} points`],
              ]}
            />
            <div className="fp-actions fp-actions-start">
              <button
                className="fp-button"
                onClick={() => {
                  setState((prev) => startAgain(prev));
                  setToast("Fresh request. Your record carries over.");
                }}
              >
                Request another advance
              </button>
              <button className="fp-secondary" onClick={() => setTab("Your record")}>
                See your record
              </button>
            </div>
          </>
        ) : null}
      </section>

      {funded ? (
        <section className="fp-card">
          <h3>Activity</h3>
          <div className="fp-row-item">
            <div>
              <strong>Advance received</strong>
              <small>{date(state.fundedOn ?? isoDate())}</small>
            </div>
            <strong>+{money(state.request.amount)}</strong>
          </div>
          {state.stage === "repaid" ? (
            <div className="fp-row-item">
              <div>
                <strong>Repayment</strong>
                <small>{date(state.repaidOn ?? isoDate())}</small>
              </div>
              <strong>−{money(terms.total)}</strong>
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  );

  const step = nextStep(record);

  const recordTab = (
    <>
      <section className="fp-card fp-record">
        <p className="fp-eyebrow">On Solana, in your name</p>
        <strong className="fp-big">
          {record} {record === 1 ? "repayment" : "repayments"}
        </strong>
        <p>
          This record doesn’t live with us. Any lender can read it, in any country, without asking our permission, and
          you keep it if you never come back.
        </p>
        <div className="fp-inline-actions">
          <button
            type="button"
            className="fp-link"
            onClick={() => {
              navigator.clipboard?.writeText(`${location.origin}/record/${state.business.name.replace(/\s+/g, "-").toLowerCase()}`);
              setToast("Link copied. Anyone can check your record with it.");
            }}
          >
            Copy a link to this record
          </button>
        </div>
      </section>

      <div className="fp-metrics">
        <div>
          <span>Fee today</span>
          <strong>{live.rate}%</strong>
          <p>{live.discount > 0 ? `${live.discount} points below a new business` : "Standard rate for a new business"}</p>
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
        <h3>What another repayment earns you</h3>
        {step ? (
          <p>
            One more on-time repayment takes another {step.fee} points off your fee and {step.margin} points off the
            margin you post on asset-backed advances. That’s it. It will never let you borrow more than the money
            coming in.
          </p>
        ) : (
          <p>
            You’ve earned every discount we offer: {BASE_MARGIN - marginRequired(record)} points of margin and{" "}
            {live.discount} points off your fee. From here your record works on other lenders, not just us.
          </p>
        )}
        <Rows
          items={[
            ["New business", `${quote(state.request.amount, state.request.days, 0).rate}% fee · ${BASE_MARGIN}% margin`],
            ["You, today", `${live.rate}% fee · ${marginRequired(record)}% margin`],
            ...(step
              ? ([
                  [
                    "Fully earned",
                    `${quote(state.request.amount, state.request.days, RECORD_STEPS).rate}% fee · ${marginRequired(RECORD_STEPS)}% margin`,
                  ],
                ] as [string, ReactNode][])
              : []),
          ]}
        />
      </section>

      {state.history.length ? (
        <section className="fp-card">
          <h3>Every advance you’ve repaid</h3>
          {state.history.map((advance, index) => (
            <div className="fp-row-item" key={`${advance.repaidOn}-${index}`}>
              <div>
                <strong>{money(advance.amount)}</strong>
                <small>
                  {advance.days} days · fee {money(advance.fee)}
                </small>
              </div>
              <span>Repaid {date(advance.repaidOn)}</span>
            </div>
          ))}
        </section>
      ) : null}
    </>
  );

  const businessTab = (
    <section className="fp-card">
      <h2>{state.business.name}</h2>
      <p>Change anything here. It applies to your next application, not to an advance already running.</p>
      <div className="fp-form-grid">
        <Field label="Business name">
          <input value={state.business.name} onChange={(e) => setBusiness({ name: e.target.value })} />
        </Field>
        <Field label="Country">
          <select value={state.business.country} onChange={(e) => setBusiness({ country: e.target.value })}>
            {COUNTRIES.map((country) => (
              <option key={country}>{country}</option>
            ))}
          </select>
        </Field>
        <Field label="Your name">
          <input
            value={state.business.representative}
            onChange={(e) => setBusiness({ representative: e.target.value })}
          />
        </Field>
        <Field label="Work email">
          <input type="email" value={state.business.email} onChange={(e) => setBusiness({ email: e.target.value })} />
        </Field>
      </div>
      <Upload
        label="Proof your business exists"
        files={state.documents}
        sample={sampleDocuments}
        onChange={(documents) => setState((prev) => ({ ...prev, documents }))}
      />
      <small className="fp-hint">Saved as you type.</small>
    </section>
  );

  const settingsTab = (
    <>
      <section className="fp-card">
        <h2>About this prototype</h2>
        <Rows
          items={[
            ["Funding", "Simulated. No money moves."],
            ["Your data", "Saved in this browser only"],
            ["Documents", "Never uploaded, names only"],
            ["Record", "Illustrative, not yet written to Solana"],
          ]}
        />
      </section>

      <section className="fp-card">
        <h3>Jump to any point</h3>
        <p>For walking someone through the journey without filling the form again.</p>
        <div className="fp-chips">
          {stages.map((stage) => (
            <button
              key={stage}
              type="button"
              aria-pressed={state.stage === stage}
              onClick={() => {
                move(stage, `Showing: ${stageLabel[stage].toLowerCase()}.`);
                setTab("Dashboard");
              }}
            >
              {stageLabel[stage]}
            </button>
          ))}
        </div>
        <div className="fp-inline-actions">
          <button
            type="button"
            className="fp-link"
            onClick={() => {
              setState((prev) => seasoned(prev));
              setToast(`Loaded a business with ${RECORD_STEPS} repayments behind it.`);
            }}
          >
            Load a business with a full record
          </button>
          <button
            type="button"
            className="fp-link"
            onClick={() => {
              setState(initial());
              setTab("Dashboard");
              setToast("Back to the beginning.");
            }}
          >
            Start over
          </button>
        </div>
      </section>
    </>
  );

  const title =
    editing && tab === "Dashboard"
      ? record === 0
        ? "Your first advance"
        : "Your next advance"
      : tab === "Dashboard"
        ? `Hello, ${state.business.representative.split(" ")[0]}`
        : tab;

  return (
    <div className="fp fp-app">
      <aside className="fp-sidebar">
        <span className="fp-brand">
          <img src="/float-logo.svg" alt="Float" />
        </span>
        <nav>
          {TABS.map((name) => (
            <button key={name} aria-current={tab === name ? "page" : undefined} onClick={() => setTab(name)}>
              {name}
            </button>
          ))}
        </nav>
        <div className="fp-sidebar-foot">
          <strong>{state.business.name}</strong>
          <small>{state.business.representative}</small>
        </div>
      </aside>

      <div className="fp-main">
        <header className="fp-top">
          <span>{stageLabel[state.stage]}</span>
          <span className="fp-pill">Prototype · no real funds</span>
        </header>

        <main className="fp-content">
          <h1 className="fp-title" tabIndex={-1} ref={heading}>
            {title}
          </h1>

          {tab === "Dashboard" ? (editing ? wizard : dashboard) : null}
          {tab === "Your record" ? recordTab : null}
          {tab === "Business" ? businessTab : null}
          {tab === "Settings" ? settingsTab : null}
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
