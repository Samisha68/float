/* Every call the live borrower journey makes. Mapping lives in `journey.ts`. */

import { api, type Application } from "./api";

export * from "./journey";

export type Quote = {
  base: number;
  rate: number;
  discount: number;
  fee: number;
  total: number;
  amount: number;
  days: number;
  repayments: number;
  marginRequired: number;
  provisional: boolean;
};

export const fetchQuote = (amount: number, days: number) =>
  api<Quote>(`/quote?amount=${encodeURIComponent(amount)}&days=${encodeURIComponent(days)}`);

export const listApplications = () => api<Application[]>("/applications");

export type NewApplication = {
  payer: string;
  invoiceNumber: string;
  invoiceDue: string;
  amount: number;
  expectedInflow: number;
  termDays: number;
  document: { name: string; base64: string };
};

export const submitApplication = (application: NewApplication) =>
  api<Application>("/applications", application);

/* Only the actions a borrower may take. Offer, information, reject and fund
   belong to the operator, and the server enforces that too. */
export type BorrowerAction = "respond" | "accept" | "decline" | "repay";

export const act = (id: string, action: BorrowerAction, body: Record<string, unknown> = {}) =>
  api<Application>(`/applications/${id}/${action}`, body);

/* Recording an advance the borrower created on Solana. The server checks the
   transaction before it believes any of it. */
export const anchorAdvance = (id: string, signature: string) =>
  api<Application>(`/applications/${id}/anchor`, { signature });

export const settleAdvance = (id: string, signature: string) =>
  api<Application>(`/applications/${id}/repay`, { signature });
