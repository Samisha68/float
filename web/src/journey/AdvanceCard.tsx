/* One advance, at whatever stage it has reached.

   The same card serves the offline prototype and the live workspace, so the
   words a borrower reads are written once. A button appears only when its
   handler is passed: the prototype passes demo handlers, the live workspace
   passes real ones, and neither shows an action the other invented. */

import { useState, type ReactNode } from "react";
import { Field, Rows } from "./parts";
import { date, money, stageLabel, type Stage } from "../lib/prototype";

export type AdvanceView = {
  stage: Stage;
  reference: string;
  business: string;
  amount: number;
  days: number;
  payer: string;
  incoming: number;
  /* Price, once Float has offered one. */
  offered: boolean;
  rate: number;
  fee: number;
  total: number;
  dueOn: string | null;
  daysLeft: number | null;
  note: string;
  /* What this borrower's record has earned so far. */
  record: number;
  marginEarned: number;
  /* What a fresh request would cost today, for the after-repayment comparison. */
  nextRate: number;
  nextFee: number;
};

export type AdvanceHandlers = {
  onRespond?: (reply: string) => void;
  onAccept?: () => void;
  onDecline?: () => void;
  onRepay?: () => void;
  onStartAgain?: () => void;
  onReopen?: () => void;
  onSeeRecord?: () => void;
  /* Prototype only: skip the waiting that a real decision needs. */
  onDemoDecision?: () => void;
  onDemoInformation?: () => void;
  onDemoFund?: () => void;
};

const STEPS = ["Application received", "Business checked", "Incoming payment checked", "Decision"];

export function AdvanceCard({
  view,
  handlers,
  busy = false,
  uploadSlot,
  footerSlot,
}: {
  view: AdvanceView;
  handlers: AdvanceHandlers;
  busy?: boolean;
  uploadSlot?: ReactNode;
  /* The live workspace puts the Solana panel here; the prototype has none. */
  footerSlot?: ReactNode;
}) {
  const [reply, setReply] = useState("");
  const [replyError, setReplyError] = useState("");
  const { stage } = view;

  const terms: [string, ReactNode][] = [
    ["You receive", <strong key="a">{money(view.amount)}</strong>],
    ["Fee", `${view.rate}% · ${money(view.fee)}`],
    ["You repay", money(view.total)],
    ["Repayment date", view.dueOn ? date(view.dueOn) : `${view.days} days after the funds land`],
  ];

  return (
    <section className="fp-card">
      <div className="fp-card-head">
        <p className="fp-eyebrow">Advance {view.reference}</p>
        <span className="fp-pill">{stageLabel[stage]}</span>
      </div>

      {stage === "requested" ? (
        <>
          <h2>We’re looking at it now</h2>
          <p>
            We’re checking {view.business} and the {money(view.incoming)} coming from {view.payer}.
          </p>
          <ol className="fp-timeline">
            {STEPS.map((label, index) => (
              <li key={label}>
                <span>{index < 2 ? "Done" : index + 1}</span>
                <div>
                  {label}
                  <small>{index < 2 ? "Complete" : index === 2 ? "Happening now" : "Next"}</small>
                </div>
              </li>
            ))}
          </ol>
          {handlers.onDemoDecision || handlers.onDemoInformation ? (
            <>
              <div className="fp-actions fp-actions-start">
                {handlers.onDemoDecision ? (
                  <button className="fp-button" onClick={handlers.onDemoDecision}>
                    Skip the wait and see the decision
                  </button>
                ) : null}
                {handlers.onDemoInformation ? (
                  <button className="fp-secondary" onClick={handlers.onDemoInformation}>
                    Show an information request
                  </button>
                ) : null}
              </div>
              <small className="fp-hint">Demo steps. A real decision takes hours, not a click.</small>
            </>
          ) : (
            <small className="fp-hint">Check back here for the decision. Nothing else is needed from you.</small>
          )}
        </>
      ) : null}

      {stage === "information" ? (
        <>
          <h2>We need one more thing</h2>
          <p>{view.note}</p>
          <Field label="Your reply" error={replyError}>
            <textarea
              rows={4}
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              placeholder="Tell us what you’re sending, or explain the gap."
            />
          </Field>
          {uploadSlot}
          <div className="fp-actions fp-actions-start">
            <button
              className="fp-button"
              disabled={busy}
              onClick={() => {
                if (!reply.trim()) {
                  setReplyError("Write a line so we know what changed.");
                  return;
                }
                setReplyError("");
                handlers.onRespond?.(reply.trim());
                setReply("");
              }}
            >
              {busy ? "Sending…" : "Send reply"}
            </button>
          </div>
          <small className="fp-hint">Your advance isn’t cancelled. It goes back in the queue.</small>
        </>
      ) : null}

      {stage === "rejected" ? (
        <>
          <h2>We couldn’t approve this one</h2>
          <p>{view.note}</p>
          <p>
            Nothing about this stops you applying again with a different payment. It doesn’t touch your record, and we
            didn’t keep anything you’ll have to redo.
          </p>
          {handlers.onStartAgain ? (
            <div className="fp-actions fp-actions-start">
              <button className="fp-button" onClick={handlers.onStartAgain}>
                Try a different payment
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {stage === "offered" ? (
        <>
          <h2>Approved. Here are the terms.</h2>
          <p>Nothing moves until you accept.</p>
          <Rows items={terms} />
          <div className="fp-actions fp-actions-start">
            <button className="fp-button" disabled={busy} onClick={handlers.onAccept}>
              {busy ? "Working…" : "Accept these terms"}
            </button>
            <button className="fp-secondary" disabled={busy} onClick={handlers.onDecline}>
              Decline
            </button>
          </div>
        </>
      ) : null}

      {stage === "accepted" ? (
        <>
          <h2>Accepted. The money is on its way.</h2>
          <p>
            We’re sending {money(view.amount)} to your wallet. Repayment of {money(view.total)} is due {view.days} days
            after it lands, not from today.
          </p>
          <Rows
            items={[
              ["You accepted", `${money(view.amount)} at ${view.rate}%`],
              ["You’ll repay", money(view.total)],
              ["Waiting on", "Float to release the funds"],
            ]}
          />
          {handlers.onDemoFund ? (
            <>
              <button className="fp-button" onClick={handlers.onDemoFund}>
                Skip the wait and receive the funds
              </button>
              <small className="fp-hint">Demo step. No money moves.</small>
            </>
          ) : (
            <small className="fp-hint">Nothing else is needed from you.</small>
          )}
        </>
      ) : null}

      {stage === "active" ? (
        <>
          <h2>Your advance is running</h2>
          <p>
            {money(view.total)} is due on {view.dueOn ? date(view.dueOn) : "the agreed date"}
            {view.daysLeft === null ? "" : `, ${Math.max(view.daysLeft, 0)} days from now`}.
          </p>
          <Rows
            items={[
              ["Advanced", money(view.amount)],
              ["Fee", money(view.fee)],
              ["Total due", <strong key="t">{money(view.total)}</strong>],
              ["Covered by", `${money(view.incoming)} from ${view.payer}`],
            ]}
          />
          <button className="fp-button" disabled={busy} onClick={handlers.onRepay}>
            {busy ? "Recording…" : `Repay ${money(view.total)}`}
          </button>
          <small className="fp-hint">Recorded as a simulated repayment. No money moves.</small>
        </>
      ) : null}

      {stage === "repaid" ? (
        <>
          <h2>Repaid, and your record grew</h2>
          <p>
            You repaid {money(view.total)} and kept working through the gap. That’s {view.record}{" "}
            {view.record === 1 ? "repayment" : "repayments"} on your record now.
          </p>
          <Rows
            items={[
              ["You paid this time", `${view.rate}% · ${money(view.fee)}`],
              ["Your next advance", `${view.nextRate}% · ${money(view.nextFee)}`],
              ["Collateral margin earned", `${view.marginEarned} points`],
            ]}
          />
          <div className="fp-actions fp-actions-start">
            {handlers.onStartAgain ? (
              <button className="fp-button" onClick={handlers.onStartAgain}>
                Request another advance
              </button>
            ) : null}
            {handlers.onSeeRecord ? (
              <button className="fp-secondary" onClick={handlers.onSeeRecord}>
                See your record
              </button>
            ) : null}
          </div>
        </>
      ) : null}

      {stage === "declined" ? (
        <>
          <h2>You declined this offer</h2>
          <p>Nothing was charged and nothing was recorded against you.</p>
          <Rows
            items={[
              ["Offered", money(view.amount)],
              ["At", `${view.rate}% · ${money(view.fee)}`],
            ]}
          />
          <div className="fp-actions fp-actions-start">
            {handlers.onReopen ? (
              <button className="fp-button" onClick={handlers.onReopen}>
                Look at it again
              </button>
            ) : null}
            {handlers.onStartAgain ? (
              <button className={handlers.onReopen ? "fp-secondary" : "fp-button"} onClick={handlers.onStartAgain}>
                Ask for something different
              </button>
            ) : null}
          </div>
        </>
      ) : null}

      {footerSlot}
    </section>
  );
}
