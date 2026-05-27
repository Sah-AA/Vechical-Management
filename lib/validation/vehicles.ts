import { z } from "zod";
import type {
  CreateFuelInput,
  CreateServiceInput,
  CreateVehicleInput,
  VehicleStatus,
} from "../api/vehicles";
import { flattenZodErrors, zDateYmd, zTrimmedName } from "./shared";

const vehicleTypeEnum = z.enum(["Tractor", "JCB", "Other"]);
const vehicleStatusEnum = z.enum([
  "Active",
  "Under_Service",
  "Idle",
] satisfies [VehicleStatus, VehicleStatus, VehicleStatus]);

export const vehicleFormSchema = z.object({
  name: zTrimmedName,
  number: z
    .string()
    .transform((s) => s.trim().toUpperCase())
    .pipe(
      z
        .string()
        .min(3, "Vehicle number is required")
        .max(32, "Vehicle number is too long"),
    ),
  type: vehicleTypeEnum,
  status: vehicleStatusEnum,
});

export type ParsedVehicleForm = z.infer<typeof vehicleFormSchema>;

export function parseVehicleForm(raw: unknown):
  | { success: true; data: CreateVehicleInput }
  | {
      success: false;
      fieldErrors: Partial<Record<keyof ParsedVehicleForm, string>>;
      formError?: string;
    } {
  const r = vehicleFormSchema.safeParse(raw);
  if (!r.success) {
    const { fieldErrors, formError } = flattenZodErrors<keyof ParsedVehicleForm>(r.error);
    return { success: false, fieldErrors, formError };
  }
  return { success: true, data: r.data as CreateVehicleInput };
}

const fuelFormSchema = z
  .object({
    vehicleId: z.coerce.number().int().positive("Pick a vehicle"),
    date: zDateYmd,
    litres: z.coerce
      .number({ invalid_type_error: "Enter litres" })
      .positive("Litres must be greater than zero")
      .max(50_000, "Litres value seems too large"),
    pricePerLitre: z.coerce
      .number({ invalid_type_error: "Enter price per litre" })
      .min(0, "Price per litre cannot be negative")
      .max(10_000, "Price per litre is too high"),
    notes: z.string(),
  })
  .transform(
    (v): CreateFuelInput => ({
      vehicleId: v.vehicleId,
      date: v.date,
      litres: v.litres,
      pricePerLitre: v.pricePerLitre,
      amount: v.litres * v.pricePerLitre,
      notes: (() => {
        const t = v.notes.trim();
        return t === "" ? undefined : t.slice(0, 500);
      })(),
    }),
  );

export type FuelFormState = z.input<typeof fuelFormSchema>;

export function parseFuelEntryForm(raw: unknown):
  | { success: true; data: CreateFuelInput }
  | {
      success: false;
      fieldErrors: Partial<Record<keyof FuelFormState, string>>;
      formError?: string;
    } {
  const r = fuelFormSchema.safeParse(raw);
  if (!r.success) {
    const { fieldErrors, formError } = flattenZodErrors<keyof FuelFormState>(r.error);
    return { success: false, fieldErrors, formError };
  }
  return { success: true, data: r.data };
}

const serviceFormSchema = z.object({
  vehicleId: z.coerce.number().int().positive("Pick a vehicle"),
  date: zDateYmd,
  description: z
    .string()
    .transform((s) => s.trim())
    .pipe(
      z
        .string()
        .min(1, "Description is required")
        .max(500, "Description is too long"),
    ),
  cost: z.coerce
    .number({ invalid_type_error: "Enter cost" })
    .int("Cost must be a whole number")
    .min(0, "Cost cannot be negative")
    .max(99_000_000, "Cost is too large"),
  status: z.enum(["Pending", "Completed"]),
});

export type ParsedServiceForm = z.infer<typeof serviceFormSchema>;

export function parseServiceEntryForm(raw: unknown):
  | { success: true; data: CreateServiceInput }
  | {
      success: false;
      fieldErrors: Partial<Record<keyof ParsedServiceForm, string>>;
      formError?: string;
    } {
  const r = serviceFormSchema.safeParse(raw);
  if (!r.success) {
    const { fieldErrors, formError } = flattenZodErrors<keyof ParsedServiceForm>(r.error);
    return { success: false, fieldErrors, formError };
  }
  return { success: true, data: r.data as CreateServiceInput };
}
