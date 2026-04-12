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

/** Dados cadastrais e endereço (criação / edição pelo painel dono). */
const branchBasicSchema = z.object({
  company_id: z.number({ error: "Empresa é obrigatória." }).int().positive("Empresa é obrigatória."),
  name: requiredText("Nome", 255),
  cnpj: requiredText("CNPJ", 18),
  zip_code: requiredText("CEP", 9),
  street: requiredText("Logradouro", 255),
  street_number: requiredText("Número", 20),
  neighborhood: requiredText("Bairro", 255),
  city: requiredText("Município", 255),
  state: requiredText("Estado", 2),
});

const branchTimesFields = {
  expedient_start_time: timeSchema,
  expedient_end_time: timeSchema,
  store_open_time: timeSchema,
  store_close_time: timeSchema,
};

export const branchCreateSchema = branchBasicSchema;
export const branchOwnerEditSchema = branchBasicSchema;
export const branchManagerEditSchema = branchBasicSchema.extend(branchTimesFields);

export type BranchFormData = z.input<typeof branchManagerEditSchema>;
export type BranchFormMode = "create" | "edit" | "edit-with-hours";
export type BranchBasicPayload = z.output<typeof branchBasicSchema>;
export type BranchManagerPayload = z.output<typeof branchManagerEditSchema>;
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
  | { success: true; data: BranchBasicPayload }
  | { success: true; data: BranchManagerPayload }
  | { success: false; errors: BranchFieldErrors } {
  const schema = mode === "edit-with-hours" ? branchManagerEditSchema : branchBasicSchema;
  const parsed = schema.safeParse(form);

  if (!parsed.success) {
    return { success: false, errors: toFieldErrors(parsed.error) };
  }

  const data = parsed.data;

  if (mode === "edit-with-hours") {
    const d = data as BranchManagerPayload;
    return {
      success: true,
      data: {
        ...d,
        expedient_start_time: toHhMm(d.expedient_start_time),
        expedient_end_time: toHhMm(d.expedient_end_time),
        store_open_time: toHhMm(d.store_open_time),
        store_close_time: toHhMm(d.store_close_time),
      },
    };
  }

  return { success: true, data };
}
