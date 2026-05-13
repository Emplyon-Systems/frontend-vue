import { z } from "zod";

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} é obrigatório.`)
    .max(max, `${label} deve ter no máximo ${max} caracteres.`);

const scaleTypeBaseSchema = z.object({
  branch_id: z.number({ required_error: "Filial é obrigatória." }).int().positive("Filial é obrigatória."),
  name: requiredText("Nome", 255),
});

export const scaleTypeCreateSchema = scaleTypeBaseSchema;
export const scaleTypeEditSchema = scaleTypeBaseSchema;

export type ScaleTypeFormData = z.input<typeof scaleTypeCreateSchema>;
export type ScaleTypeCreateData = z.output<typeof scaleTypeCreateSchema>;
export type ScaleTypeEditData = z.output<typeof scaleTypeEditSchema>;
export type ScaleTypeFormMode = "create" | "edit";
export type ScaleTypeFieldErrors = Partial<Record<keyof ScaleTypeFormData, string>>;

export const scaleTypeInitialForm = (): ScaleTypeFormData => ({
  branch_id: 0,
  name: "",
});

function toFieldErrors(error: z.ZodError): ScaleTypeFieldErrors {
  const fields: ScaleTypeFieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string" || fields[field as keyof ScaleTypeFormData]) continue;
    fields[field as keyof ScaleTypeFormData] = issue.message;
  }
  return fields;
}

export function validateScaleTypeForm(
  form: ScaleTypeFormData,
  mode: ScaleTypeFormMode
):
  | { success: true; data: ScaleTypeCreateData | ScaleTypeEditData }
  | { success: false; errors: ScaleTypeFieldErrors } {
  const schema = mode === "create" ? scaleTypeCreateSchema : scaleTypeEditSchema;
  const parsed = schema.safeParse(form);

  if (!parsed.success) {
    return { success: false, errors: toFieldErrors(parsed.error) };
  }

  return { success: true, data: parsed.data };
}
