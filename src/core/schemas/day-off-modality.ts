import { z } from "zod";

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} é obrigatório.`)
    .max(max, `${label} deve ter no máximo ${max} caracteres.`);

const dayOffModalityBaseSchema = z.object({
  branch_id: z.number().int().positive("Filial é obrigatória."),
  name: requiredText("Nome", 255),
  description: z.string().trim().optional(),
  is_default: z.boolean().optional(),
});

export const dayOffModalityCreateSchema = dayOffModalityBaseSchema;
export const dayOffModalityEditSchema = dayOffModalityBaseSchema.partial().extend({
  branch_id: z.number().int().positive("Filial é obrigatória."),
  name: requiredText("Nome", 255),
});

export type DayOffModalityFormData = z.input<typeof dayOffModalityCreateSchema>;
export type DayOffModalityFormMode = "create" | "edit";
export type DayOffModalityFieldErrors = Partial<Record<keyof DayOffModalityFormData, string>>;

export const dayOffModalityInitialForm = (): DayOffModalityFormData => ({
  branch_id: 0,
  name: "",
  description: "",
  is_default: false,
});

function toFieldErrors(error: z.ZodError): DayOffModalityFieldErrors {
  const fields: DayOffModalityFieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string" || fields[field as keyof DayOffModalityFormData]) continue;
    fields[field as keyof DayOffModalityFormData] = issue.message;
  }
  return fields;
}

export function validateDayOffModalityForm(form: DayOffModalityFormData, mode: DayOffModalityFormMode) {
  const schema = mode === "create" ? dayOffModalityCreateSchema : dayOffModalityEditSchema;
  const parsed = schema.safeParse(form);
  if (!parsed.success) return { success: false as const, errors: toFieldErrors(parsed.error) };
  return { success: true as const, data: parsed.data };
}
