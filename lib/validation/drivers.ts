import { z } from "zod";
import type { CreateDriverInput, DriverStatus } from "../api/drivers";
import { flattenZodErrors, zDateYmd, zIndianMobile, zMonthlySalaryInr, zTrimmedName } from "./shared";

export { parseAdvanceAmountString, parseSalaryPayAmount } from "./amounts";

const driverStatusEnum = z.enum(["Active", "Inactive"] satisfies [
  DriverStatus,
  DriverStatus,
]);

export const driverFormSchema = z.object({
  name: zTrimmedName,
  mobile: zIndianMobile,
  joiningDate: zDateYmd,
  monthlySalary: zMonthlySalaryInr,
  status: driverStatusEnum,
});

export type ParsedDriverForm = z.infer<typeof driverFormSchema>;

export function parseDriverForm(
  raw: unknown,
):
  | { success: true; data: CreateDriverInput }
  | {
      success: false;
      fieldErrors: Partial<Record<keyof ParsedDriverForm, string>>;
      formError?: string;
    } {
  const r = driverFormSchema.safeParse(raw);
  if (!r.success) {
    const { fieldErrors, formError } = flattenZodErrors<keyof ParsedDriverForm>(r.error);
    return { success: false, fieldErrors, formError };
  }
  return { success: true, data: r.data as CreateDriverInput };
}
