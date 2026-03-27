import { z } from "zod";

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} é obrigatório.`)
    .max(max, `${label} deve ter no máximo ${max} caracteres.`);

const limitInt = (label: string) =>
  z.coerce
    .number({ invalid_type_error: `${label}: informe um número válido.` })
    .int(`${label} deve ser um número inteiro.`)
    .min(1, `${label} deve ser pelo menos 1.`)
    .max(999_999, `${label} é demasiado alto.`);

const companyBaseSchema = z.object({
  name: requiredText("Nome", 255),
  cnpj: requiredText("CNPJ", 18),
  zip_code: requiredText("CEP", 9),
  street: requiredText("Logradouro", 255),
  street_number: requiredText("Número", 20),
  neighborhood: requiredText("Bairro", 255),
  city: requiredText("Município", 255),
  state: requiredText("Estado", 2),
  email: z.string().trim().min(1, "E-mail é obrigatório.").email("E-mail inválido.").max(255),
  phone: requiredText("Telefone", 20),
  branch_limit: limitInt("Limite de filiais"),
  user_limit: limitInt("Limite de usuários"),
});

export const companyCreateSchema = companyBaseSchema.extend({
  user_name: requiredText("Nome do usuário", 255),
  user_email: z
    .string()
    .trim()
    .min(1, "E-mail do usuário é obrigatório.")
    .email("E-mail do usuário inválido.")
    .max(255),
  user_password: z
    .string()
    .min(1, "Palavra-passe do usuário é obrigatória.")
    .min(6, "Palavra-passe do usuário deve ter no mínimo 6 caracteres."),
  user_password_confirmation: z
    .string()
    .min(1, "Confirmação da palavra-passe é obrigatória.")
    .min(6, "Confirmação da palavra-passe deve ter no mínimo 6 caracteres."),
}).superRefine((data, ctx) => {
  if (data.user_password !== data.user_password_confirmation) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["user_password_confirmation"],
      message: "A confirmação da palavra-passe não confere.",
    });
  }
});

export const companyEditSchema = companyBaseSchema;

export type CompanyFormData = z.input<typeof companyCreateSchema>;
export type CompanyCreateData = z.output<typeof companyCreateSchema>;
export type CompanyEditData = z.output<typeof companyEditSchema>;
export type CompanyFormMode = "create" | "edit";
export type CompanyFieldErrors = Partial<Record<keyof CompanyFormData, string>>;

export const companyInitialForm = (): CompanyFormData => ({
  name: "",
  cnpj: "",
  zip_code: "",
  street: "",
  street_number: "",
  neighborhood: "",
  city: "",
  state: "",
  email: "",
  phone: "",
  branch_limit: 10,
  user_limit: 50,
  user_name: "",
  user_email: "",
  user_password: "",
  user_password_confirmation: "",
});

function toFieldErrors(error: z.ZodError): CompanyFieldErrors {
  const fields: CompanyFieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string" || fields[field as keyof CompanyFormData]) continue;
    fields[field as keyof CompanyFormData] = issue.message;
  }
  return fields;
}

export function validateCompanyForm(
  form: CompanyFormData,
  mode: CompanyFormMode
):
  | { success: true; data: CompanyCreateData | CompanyEditData }
  | { success: false; errors: CompanyFieldErrors } {
  const schema = mode === "create" ? companyCreateSchema : companyEditSchema;
  const parsed = schema.safeParse(form);

  if (!parsed.success) {
    return { success: false, errors: toFieldErrors(parsed.error) };
  }

  return { success: true, data: parsed.data };
}
