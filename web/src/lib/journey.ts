/* Reading the API's applications as the borrower journey.

   Pure mapping, no network: the API is the authority on status, fee and total,
   and nothing here decides what an advance costs. `live.ts` does the calls. */

import type { Application } from "./api";
import type { Stage } from "./prototype";

export type { Application };

/* Application statuses map one for one onto the journey's stages. The API
   never stores `draft`: an application exists only once it is submitted. */
const STAGE_OF: Record<Application["status"], Stage> = {
  Requested: "requested",
  NeedsInformation: "information",
  Rejected: "rejected",
  Offered: "offered",
  Accepted: "accepted",
  Declined: "declined",
  Active: "active",
  Repaid: "repaid",
};

export const stageOf = (application: Application): Stage => STAGE_OF[application.status];

const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/* What Float last said. An information request or a rejection is only useful
   to a borrower if the operator's reason travels with it. */
export function latestNote(application: Application) {
  for (let i = application.events.length - 1; i >= 0; i--)
    if (application.events[i].actor === "Float") return application.events[i].message;
  return "";
}

export type Advance = {
  id: string;
  stage: Stage;
  amount: number;
  days: number;
  payer: string;
  invoiceNumber: string;
  incoming: number;
  /* Zero until an offer exists: before that there is no price, and showing a
     guess would be showing a number Float has not agreed to. */
  rate: number;
  fee: number;
  total: number;
  offered: boolean;
  dueOn: string | null;
  requestedOn: string;
  note: string;
  documentName: string;
};

export function toAdvance(application: Application): Advance {
  const offered = application.feeBps > 0 && application.totalDue > 0;
  return {
    id: application.id,
    stage: stageOf(application),
    amount: application.amount,
    days: application.termDays,
    payer: application.payer,
    invoiceNumber: application.invoiceNumber,
    incoming: application.expectedInflow,
    rate: offered ? application.feeBps / 100 : 0,
    fee: offered ? Math.round((application.totalDue - application.amount) * 100) / 100 : 0,
    total: offered ? application.totalDue : 0,
    offered,
    dueOn: application.dueAt ? iso(application.dueAt) : null,
    requestedOn: iso(application.requestedAt),
    note: latestNote(application),
    documentName: application.documentName,
  };
}

/* The record is what the borrower has actually settled, counted from the same
   list the screen is drawn from. */
export const repaidCount = (applications: Application[]) =>
  applications.filter((a) => a.status === "Repaid").length;

/* The one application a borrower is currently dealing with: anything still
   open, else the most recent. The API returns newest first. */
export function current(applications: Application[]) {
  const open = applications.find((a) => !["Repaid", "Rejected", "Declined"].includes(a.status));
  return open ?? applications[0] ?? null;
}
