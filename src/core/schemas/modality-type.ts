import { z } from "zod";

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} é obrigatório.`)
    .max(max, `${label} deve ter no máximo ${max} caracteres.`);

const modalityTypeBaseSchema = z.object({
  branch_id: z.number({ required_error: "Filial é obrigatória." }).int().positive("Filial é obrigatória."),
  name: requiredText("Nome", 255),
});

export const modalityTypeCreateSchema = modalityTypeBaseSchema;
export const modalityTypeEditSchema = modalityTypeBaseSchema;

export type ModalityTypeFormData = z.input<typeof modalityTypeCreateSchema>;
export type ModalityTypeCreateData = z.output<typeof modalityTypeCreateSchema>;
export type ModalityTypeEditData = z.output<typeof modalityTypeEditSchema>;
export type ModalityTypeFormMode = "create" | "edit";
export type ModalityTypeFieldErrors = Partial<Record<keyof ModalityTypeFormData, string>>;

export const modalityTypeInitialForm = (): ModalityTypeFormData => ({
  branch_id: 0,
  name: "",
});

function toFieldErrors(error: z.ZodError): ModalityTypeFieldErrors {
  const fields: ModalityTypeFieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string" || fields[field as keyof ModalityTypeFormData]) continue;
    fields[field as keyof ModalityTypeFormData] = issue.message;
  }
  return fields;
}

export function validateModalityTypeForm(
  form: ModalityTypeFormData,
  mode: ModalityTypeFormMode
):
  | { success: true; data: ModalityTypeCreateData | ModalityTypeEditData }
  | { success: false; errors: ModalityTypeFieldErrors } {
  const schema = mode === "create" ? modalityTypeCreateSchema : modalityTypeEditSchema;
  const parsed = schema.safeParse(form);

  if (!parsed.success) {
    return { success: false, errors: toFieldErrors(parsed.error) };
  }

  return { success: true, data: parsed.data };
}
