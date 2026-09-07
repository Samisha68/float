export interface User {
  id: string;
  email: string;
  name: string;
  role: "borrower" | "operator";
}
export interface Application {
  id: string;
  businessName: string;
  payer: string;
  invoiceNumber: string;
  invoiceDue: string;
  amount: number;
  expectedInflow: number;
  termDays: number;
  feeBps: number;
  totalDue: number;
  status:
    | "Requested"
    | "NeedsInformation"
    | "Offered"
    | "Accepted"
    | "Active"
    | "Repaid"
    | "Rejected"
    | "Declined";
  requestedAt: number;
  dueAt: number | null;
  documentName: string;
  events: { at: number; actor: string; message: string }[];
}
export class ApiError extends Error {
  constructor(message: string, public code?: string) { super(message); this.name="ApiError"; }
}
export async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: "same-origin",
    ...(body === undefined
      ? {}
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
  const data = await response
    .json()
    .catch(() => ({ error: "The service is unavailable. Please try again." }));
  if (!response.ok)
    throw new ApiError(data.error || "The request could not be completed.", data.code);
  return data;
}
export async function invoiceFile(file: File) {
  if (file.size > 5 * 1024 * 1024)
    throw new Error("Choose an invoice smaller than 5 MB.");
  return new Promise<{ name: string; base64: string }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () =>
      reject(new Error("Could not read this file. Please select it again."));
    reader.onload = () =>
      resolve({ name: file.name, base64: String(reader.result).split(",")[1] });
    reader.readAsDataURL(file);
  });
}
