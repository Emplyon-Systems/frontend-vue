import { z } from "zod";

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} é obrigatório.`)
    .max(max, `${label} deve ter no máximo ${max} caracteres.`);

const userBaseSchema = z.object({
  name: requiredText("Nome", 255),
  email: z.string().trim().min(1, "E-mail é obrigatório.").email("E-mail inválido.").max(255),
  status: z.enum(["active", "inactive"]).default("active"),
  roles: z.array(z.number()).min(1, "Selecione pelo menos um perfil."),
  direct_permission_ids: z.array(z.number()).default([]),
  company_ids: z.array(z.number()).default([]),
  branch_ids: z.array(z.number()).default([]),
  sector_ids: z.array(z.number()).default([]),
});

export const userCreateSchema = userBaseSchema.extend({
  password: z
    .string()
    .min(1, "Palavra-passe é obrigatória.")
    .min(6, "Palavra-passe deve ter no mínimo 6 caracteres."),
  password_confirmation: z
    .string()
    .min(1, "Confirmação da palavra-passe é obrigatória.")
    .min(6, "Confirmação da palavra-passe deve ter no mínimo 6 caracteres."),
}).superRefine((data, ctx) => {
  if (data.password !== data.password_confirmation) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["password_confirmation"],
      message: "A confirmação da palavra-passe não confere.",
    });
  }
});

export const userEditSchema = userBaseSchema.extend({
  password: z.string().optional(),
  password_confirmation: z.string().optional(),
});

/** Dados do formulário (create: password obrigatório; edit: password opcional) */
export type UserFormData = z.input<typeof userEditSchema>;
export type UserCreateData = z.output<typeof userCreateSchema>;
export type UserEditData = z.output<typeof userEditSchema>;
export type UserFormMode = "create" | "edit";
export type UserFieldErrors = Partial<Record<keyof UserFormData, string>>;

export function userInitialForm(mode: UserFormMode): UserFormData {
  const base = {
    name: "",
    email: "",
    status: "active" as const,
    roles: [] as number[],
    direct_permission_ids: [] as number[],
    company_ids: [] as number[],
    branch_ids: [] as number[],
    sector_ids: [] as number[],
  };
  return mode === "create"
    ? { ...base, password: "", password_confirmation: "" }
    : { ...base, password: undefined, password_confirmation: undefined };
}

function toFieldErrors(error: z.ZodError): UserFieldErrors {
  const fields: UserFieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string") continue;
    const key = field as keyof UserFormData;
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

export function validateUserForm(
  form: UserFormData,
  mode: UserFormMode
): { success: true; data: UserCreateData | UserEditData } | { success: false; errors: UserFieldErrors } {
  const schema = mode === "create" ? userCreateSchema : userEditSchema;
  const parsed = schema.safeParse(form);

  if (!parsed.success) {
    return { success: false, errors: toFieldErrors(parsed.error) };
  }

  return { success: true, data: parsed.data };
}
