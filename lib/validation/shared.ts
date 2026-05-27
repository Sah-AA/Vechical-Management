import { z } from "zod";

/** Normalize common Indian mobile inputs to 10 digits (no country code). */
export function normalizeIndianMobileDigits(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d;
}

/** Trim → digits → validate 10-digit Indian mobile (starts with 6–9). */
export const zIndianMobile = z
  .string()
  .transform((s) => s.trim())
  .transform((s) => normalizeIndianMobileDigits(s))
  .pipe(
    z
      .string()
      .length(10, "Enter a valid 10-digit mobile number")
      .regex(/^[6-9]\d{9}$/, "Indian mobile must start with 6–9"),
  );

export const zDateYmd = z
  .string()
  .min(1, "Date is required")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date")
  .refine((s) => !Number.isNaN(Date.parse(`${s}T12:00:00`)), {
    message: "That date is not valid",
  });

export const zTrimmedName = z
  .string()
  .transform((s) => s.trim())
  .pipe(
    z
      .string()
      .min(1, "Name is required")
      .max(120, "Name must be at most 120 characters"),
  );

export const zMonthlySalaryInr = z.coerce
  .number({ invalid_type_error: "Enter a valid monthly salary" })
  .int("Salary must be a whole number (no paise in this field)")
  .min(1, "Salary must be at least ₹1")
  .max(99_000_000, "Salary is too large");

export function flattenZodErrors<K extends PropertyKey>(
  error: z.ZodError,
): { fieldErrors: Partial<Record<K, string>>; formError?: string } {
  const flat = error.flatten();
  const fieldErrors: Partial<Record<K, string>> = {};
  for (const key of Object.keys(flat.fieldErrors) as K[]) {
    const msgs = flat.fieldErrors[key as string];
    if (msgs?.length) fieldErrors[key] = msgs[0];
  }
  return { fieldErrors, formError: flat.formErrors[0] };
}
