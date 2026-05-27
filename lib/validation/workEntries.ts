import { z } from "zod";
import type { CreateWorkEntryInput, WorkEntryStatus } from "../api/workEntries";
import { flattenZodErrors, zDateYmd } from "./shared";

const workStatusEnum = z.enum(["Paid", "Pending"] satisfies [
  WorkEntryStatus,
  WorkEntryStatus,
]);

export const workEntryFormSchema = z.object({
  vehicleId: z.coerce.number().int().positive("Pick a vehicle"),
  customerId: z.coerce.number().int().positive("Pick a customer"),
  driverId: z.coerce.number().int().positive("Pick a driver"),
  date: zDateYmd,
  hours: z.coerce
    .number({ invalid_type_error: "Enter hours worked" })
    .positive("Hours must be greater than zero")
    .max(24_000, "Hours value seems too large"),
  ratePerHour: z.coerce
    .number({ invalid_type_error: "Enter rate per hour" })
    .min(0, "Rate cannot be negative")
    .max(10_000_000, "Rate is too large"),
  notes: z.string(),
  status: workStatusEnum,
});

export type WorkEntryFormState = z.input<typeof workEntryFormSchema>;

const workEntryPayloadSchema = workEntryFormSchema.transform(
  (v): CreateWorkEntryInput => ({
    vehicleId: v.vehicleId,
    customerId: v.customerId,
    driverId: v.driverId,
    date: v.date,
    hours: v.hours,
    ratePerHour: v.ratePerHour,
    status: v.status,
    notes: (() => {
      const t = v.notes.trim();
      return t === "" ? undefined : t.slice(0, 500);
    })(),
  }),
);

export function parseWorkEntryForm(raw: unknown):
  | { success: true; data: CreateWorkEntryInput }
  | {
      success: false;
      fieldErrors: Partial<Record<keyof WorkEntryFormState, string>>;
      formError?: string;
    } {
  const r = workEntryPayloadSchema.safeParse(raw);
  if (!r.success) {
    const { fieldErrors, formError } = flattenZodErrors<keyof WorkEntryFormState>(r.error);
    return { success: false, fieldErrors, formError };
  }
  return { success: true, data: r.data };
}
