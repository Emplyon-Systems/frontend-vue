import { z } from "zod";

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} é obrigatório.`)
    .max(max, `${label} deve ter no máximo ${max} caracteres.`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === "" ? undefined : v));

const assignmentRowSchema = z.object({
  branch_id: z.number({ required_error: "Filial é obrigatória." }).int().positive("Selecione uma filial."),
  sector_id: z.number({ required_error: "Setor é obrigatório." }).int().positive("Selecione um setor."),
  is_primary: z.boolean().optional(),
});

const employeeBaseSchema = z.object({
  company_id: z.number().int().nonnegative(),
  /** 0 = sem usuário da aplicação vinculado */
  user_id: z.number().int().nonnegative(),
  name: requiredText("Nome", 255),
  cpf: z
    .string()
    .trim()
    .min(1, "CPF é obrigatório.")
    .max(14, "CPF inválido.")
    .transform((s) => s.replace(/\D/g, ""))
    .refine((s) => s.length >= 11 && s.length <= 11, "CPF deve ter 11 dígitos."),
  email: z.string().trim().min(1, "E-mail é obrigatório.").email("E-mail inválido.").max(255),
  phone: requiredText("Telefone", 30),
  job_title: requiredText("Cargo", 255),
  street: optionalText(255),
  street_number: optionalText(30),
  complement: optionalText(120),
  neighborhood: optionalText(255),
  zip_code: optionalText(9),
  city: optionalText(255),
  state: z
    .string()
    .trim()
    .max(2)
    .optional()
    .transform((v) => (v === "" ? undefined : v?.toUpperCase())),
  assignments: z.array(assignmentRowSchema).min(1, "Adicione ao menos uma filial com setor."),
});

export const employeeCreateSchema = employeeBaseSchema.superRefine((data, ctx) => {
  const seen = new Set<number>();
  for (let i = 0; i < data.assignments.length; i++) {
    const b = data.assignments[i].branch_id;
    if (seen.has(b)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Filial repetida.",
        path: ["assignments", i, "branch_id"],
      });
    }
    seen.add(b);
  }
  if (data.company_id > 0) {
    return;
  }
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: "Empresa é obrigatória.",
    path: ["company_id"],
  });
});

export const employeeEditSchema = employeeBaseSchema
  .extend({
    company_id: z.number().int().positive("Empresa é obrigatória."),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<number>();
    for (let i = 0; i < data.assignments.length; i++) {
      const b = data.assignments[i].branch_id;
      if (seen.has(b)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Filial repetida.",
          path: ["assignments", i, "branch_id"],
        });
      }
      seen.add(b);
    }
  });

export type EmployeeFormData = z.input<typeof employeeBaseSchema>;
export type EmployeeCreateData = z.output<typeof employeeCreateSchema>;
export type EmployeeEditData = z.output<typeof employeeEditSchema>;
export type EmployeeFormMode = "create" | "edit";
export type EmployeeFieldErrors = Partial<Record<keyof EmployeeFormData | "assignments" | `assignments.${number}`, string>>;

export function employeeInitialForm(): EmployeeFormData {
  return {
    company_id: 0,
    user_id: 0,
    name: "",
    cpf: "",
    email: "",
    phone: "",
    job_title: "",
    street: "",
    street_number: "",
    complement: "",
    neighborhood: "",
    zip_code: "",
    city: "",
    state: "",
    assignments: [{ branch_id: 0, sector_id: 0, is_primary: true }],
  };
}

function toFieldErrors(error: z.ZodError): EmployeeFieldErrors {
  const fields: EmployeeFieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") as keyof EmployeeFieldErrors;
    if (fields[key]) continue;
    fields[key] = issue.message;
  }
  return fields;
}

export function validateEmployeeForm(
  form: EmployeeFormData,
  mode: EmployeeFormMode
):
  | { success: true; data: EmployeeCreateData | EmployeeEditData }
  | { success: false; errors: EmployeeFieldErrors } {
  const schema = mode === "create" ? employeeCreateSchema : employeeEditSchema;
  const parsed = schema.safeParse(form);

  if (!parsed.success) {
    return { success: false, errors: toFieldErrors(parsed.error) };
  }

  return { success: true, data: parsed.data };
}
