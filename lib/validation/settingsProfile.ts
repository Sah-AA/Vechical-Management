import { z } from "zod";
import { flattenZodErrors, zIndianMobile, zTrimmedName } from "./shared";

const ownerProfileSchema = z.object({
  name: zTrimmedName,
  phone: zIndianMobile,
  businessName: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().max(200, "Organisation name is too long")),
  address: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().max(2000, "Address is too long")),
  state: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().max(120, "State is too long")),
  pincode: z
    .string()
    .transform((s) => s.trim())
    .pipe(
      z
        .union([
          z.literal(""),
          z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
        ])
        .transform((s) => s),
    ),
});

export type SettingsProfileForm = z.infer<typeof ownerProfileSchema>;

const managerProfileSchema = z.object({
  name: zTrimmedName,
  phone: zIndianMobile,
});

export type SettingsManagerProfileForm = z.infer<typeof managerProfileSchema>;

export type SettingsProfilePayload = {
  name: string;
  phone: string;
  businessName: string;
  address: string;
  state: string;
  pincode: string;
};

export function parseSettingsProfileForm(
  raw: unknown,
  opts: { isManager: boolean },
):
  | { success: true; data: SettingsProfilePayload }
  | {
      success: false;
      fieldErrors: Partial<Record<string, string>>;
      formError?: string;
    } {
  if (opts.isManager) {
    const r = managerProfileSchema.safeParse(raw);
    if (!r.success) {
      const { fieldErrors, formError } = flattenZodErrors(r.error);
      return { success: false, fieldErrors, formError };
    }
    return {
      success: true,
      data: {
        name: r.data.name,
        phone: r.data.phone,
        businessName: "",
        address: "",
        state: "",
        pincode: "",
      },
    };
  }
  const r = ownerProfileSchema.safeParse(raw);
  if (!r.success) {
    const { fieldErrors, formError } = flattenZodErrors(r.error);
    return { success: false, fieldErrors, formError };
  }
  const d = r.data;
  return {
    success: true,
    data: {
      name: d.name,
      phone: d.phone,
      businessName: d.businessName,
      address: d.address,
      state: d.state,
      pincode: d.pincode,
    },
  };
}
