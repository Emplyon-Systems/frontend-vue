import { z } from "zod";

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} é obrigatório.`)
    .max(max, `${label} deve ter no máximo ${max} caracteres.`);

const timeSchema = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Formato inválido (use HH:mm)");

function toHhMm(time: string): string {
  const m = String(time ?? "").match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "08:00";
}

const branchBaseSchema = z.object({
  company_id: z.number({ error: "Empresa é obrigatória." }).int().positive("Empresa é obrigatória."),
  name: requiredText("Nome", 255),
  cnpj: requiredText("CNPJ", 18),
  zip_code: requiredText("CEP", 9),
  street: requiredText("Logradouro", 255),
  street_number: requiredText("Número", 20),
  neighborhood: requiredText("Bairro", 255),
  city: requiredText("Município", 255),
  state: requiredText("Estado", 2),
  expedient_start_time: timeSchema,
  expedient_end_time: timeSchema,
  store_open_time: timeSchema,
  store_close_time: timeSchema,
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
  expedient_start_time: "08:00",
  expedient_end_time: "18:00",
  store_open_time: "09:00",
  store_close_time: "18:00",
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
  mode: BranchFormMode,
):
  | { success: true; data: BranchCreateData | BranchEditData }
  | { success: false; errors: BranchFieldErrors } {
  const schema = mode === "create" ? branchCreateSchema : branchEditSchema;
  const parsed = schema.safeParse(form);

  if (!parsed.success) {
    return { success: false, errors: toFieldErrors(parsed.error) };
  }

  const data = parsed.data;

  return {
    success: true,
    data: {
      ...data,
      expedient_start_time: toHhMm(data.expedient_start_time),
      expedient_end_time: toHhMm(data.expedient_end_time),
      store_open_time: toHhMm(data.store_open_time),
      store_close_time: toHhMm(data.store_close_time),
    },
  };
}
