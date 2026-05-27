import { z } from "zod";
import type { CreateCustomerInput } from "../api/customers";
import { flattenZodErrors, zIndianMobile, zTrimmedName } from "./shared";

const accountStatusEnum = z.enum(["Paid", "Pending"]);

const customerFormSchema = z
  .object({
    name: zTrimmedName,
    mobile: zIndianMobile,
    address: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().max(2000, "Address is too long")),
    accountStatus: accountStatusEnum,
  })
  .transform(
    (v): CreateCustomerInput => ({
      name: v.name,
      phone: v.mobile,
      address: v.address || undefined,
      status: v.accountStatus === "Paid" ? "Active" : "Inactive",
    }),
  );

export type CustomerFormInput = z.input<typeof customerFormSchema>;

export function parseCustomerForm(raw: unknown):
  | { success: true; data: CreateCustomerInput }
  | {
      success: false;
      fieldErrors: Partial<
        Record<"name" | "mobile" | "address" | "accountStatus", string>
      >;
      formError?: string;
    } {
  const r = customerFormSchema.safeParse(raw);
  if (!r.success) {
    const { fieldErrors, formError } = flattenZodErrors(r.error);
    return { success: false, fieldErrors, formError };
  }
  return { success: true, data: r.data };
}
