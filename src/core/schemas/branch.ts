import { z } from "zod";

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} é obrigatório.`)
    .max(max, `${label} deve ter no máximo ${max} caracteres.`);

const branchBaseSchema = z.object({
  company_id: z.number({ required_error: "Empresa é obrigatória." }).int().positive("Empresa é obrigatória."),
  name: requiredText("Nome", 255),
  cnpj: requiredText("CNPJ", 18),
  zip_code: requiredText("CEP", 9),
  street: requiredText("Logradouro", 255),
  street_number: requiredText("Número", 20),
  neighborhood: requiredText("Bairro", 255),
  city: requiredText("Município", 255),
  state: requiredText("Estado", 2),
});

export const branchCreateSchema = branchBaseSchema;
export const branchEditSchema = branchBaseSchema;

export type BranchFormData = z.input<typeof branchCreateSchema>;
export type BranchCreateData = z.output<typeof branchCreateSchema>;
export type BranchEditData = z.output<typeof branchEditSchema>;
export type BranchFormMode = "create" | "edit";
export type BranchFieldErrors = Partial<Record<keyof BranchFormData, string>>;

export const branchInitialForm = (): BranchFormData => ({
  company_id: 0,
  name: "",
  cnpj: "",
  zip_code: "",
  street: "",
  street_number: "",
  neighborhood: "",
  city: "",
  state: "",
});

function toFieldErrors(error: z.ZodError): BranchFieldErrors {
  const fields: BranchFieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string" || fields[field as keyof BranchFormData]) continue;
    fields[field as keyof BranchFormData] = issue.message;
  }
  return fields;
}

export function validateBranchForm(
  form: BranchFormData,
  mode: BranchFormMode
):
  | { success: true; data: BranchCreateData | BranchEditData }
  | { success: false; errors: BranchFieldErrors } {
  const schema = mode === "create" ? branchCreateSchema : branchEditSchema;
  const parsed = schema.safeParse(form);

  if (!parsed.success) {
    return { success: false, errors: toFieldErrors(parsed.error) };
  }

  return { success: true, data: parsed.data };
}
