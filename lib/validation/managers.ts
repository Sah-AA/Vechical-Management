import { z } from "zod";
import type {
  CreateManagerInput,
  ManagerStatus,
  UpdateManagerInput,
} from "../api/managers";
import {
  flattenZodErrors,
  zDateYmd,
  zIndianMobile,
  zMonthlySalaryInr,
  zTrimmedName,
} from "./shared";

const managerStatusEnum = z.enum(["Active", "Inactive"] satisfies [
  ManagerStatus,
  ManagerStatus,
]);

const managerFormBaseSchema = z.object({
  name: zTrimmedName,
  mobile: zIndianMobile,
  email: z
    .string()
    .transform((s) => s.trim().toLowerCase())
    .pipe(
      z
        .string()
        .min(1, "Email is required")
        .email("Enter a valid email")
        .max(254, "Email is too long"),
    ),
  password: z.string(),
  joiningDate: zDateYmd,
  monthlySalary: zMonthlySalaryInr,
  status: managerStatusEnum,
});

export type ParsedManagerFormFields = z.infer<typeof managerFormBaseSchema>;

function managerSchemaForMode(creating: boolean) {
  return managerFormBaseSchema.superRefine((val, ctx) => {
    const pw = val.password.trim();
    if (creating) {
      if (!pw) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password is required",
          path: ["password"],
        });
        return;
      }
      if (pw.length < 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password must be at least 6 characters",
          path: ["password"],
        });
      }
    } else if (pw && pw.length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must be at least 6 characters",
        path: ["password"],
      });
    }
  });
}

export function parseManagerForm(
  raw: unknown,
  opts: { creating: boolean },
):
  | ({ success: true } & (
      | { creating: true; data: CreateManagerInput }
      | { creating: false; data: UpdateManagerInput }
    ))
  | {
      success: false;
      fieldErrors: Partial<Record<keyof ParsedManagerFormFields, string>>;
      formError?: string;
    } {
  const r = managerSchemaForMode(opts.creating).safeParse(raw);
  if (!r.success) {
    const { fieldErrors, formError } = flattenZodErrors<keyof ParsedManagerFormFields>(
      r.error,
    );
    return { success: false, fieldErrors, formError };
  }
  const { name, mobile, email, password, joiningDate, monthlySalary, status } = r.data;
  if (opts.creating) {
    return {
      success: true,
      creating: true,
      data: {
        name,
        mobile,
        email,
        password: password.trim(),
        joiningDate,
        monthlySalary,
        status,
      },
    };
  }
  const payload: UpdateManagerInput = {
    name,
    mobile,
    email,
    joiningDate,
    monthlySalary,
    status,
  };
  const pw = password.trim();
  if (pw) payload.password = pw;
  return { success: true, creating: false, data: payload };
}
