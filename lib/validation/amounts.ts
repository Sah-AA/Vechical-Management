import { z } from "zod";

export const advanceAmountSchema = z.coerce
  .number({ invalid_type_error: "Enter a valid amount" })
  .int("Use a whole number in rupees")
  .min(1, "Amount must be at least ₹1")
  .max(999_999_999, "Amount is too large");

export function parseAdvanceAmountString(raw: string):
  | { ok: true; amount: number }
  | { ok: false; message: string } {
  const t = raw.trim();
  if (!t) return { ok: false, message: "Enter an amount" };
  const r = advanceAmountSchema.safeParse(t);
  if (!r.success) {
    return { ok: false, message: r.error.issues[0]?.message ?? "Invalid amount" };
  }
  return { ok: true, amount: r.data };
}

export function parseSalaryPayAmount(raw: string):
  | { ok: true; amount: number | undefined }
  | { ok: false; message: string } {
  const t = raw.trim();
  if (t === "") return { ok: true, amount: undefined };
  const r = z.coerce
    .number()
    .int("Use a whole number in rupees")
    .positive("Amount must be greater than zero")
    .max(999_999_999, "Amount is too large")
    .safeParse(t);
  if (!r.success) {
    const msg = r.error.issues[0]?.message ?? "Invalid amount";
    return { ok: false, message: msg };
  }
  return { ok: true, amount: r.data };
}
