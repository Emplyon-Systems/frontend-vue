import { z } from "zod";

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} é obrigatório.`)
    .max(max, `${label} deve ter no máximo ${max} caracteres.`);

const positionBaseSchema = z.object({
  branch_id: z.number({ required_error: "Filial é obrigatória." }).int().positive("Filial é obrigatória."),
  name: requiredText("Nome", 255),
});

export const positionCreateSchema = positionBaseSchema;
export const positionEditSchema = positionBaseSchema;

export type PositionFormData = z.input<typeof positionCreateSchema>;
export type PositionCreateData = z.output<typeof positionCreateSchema>;
export type PositionEditData = z.output<typeof positionEditSchema>;
export type PositionFormMode = "create" | "edit";
export type PositionFieldErrors = Partial<Record<keyof PositionFormData, string>>;

export const positionInitialForm = (): PositionFormData => ({
  branch_id: 0,
  name: "",
});

function toFieldErrors(error: z.ZodError): PositionFieldErrors {
  const fields: PositionFieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string" || fields[field as keyof PositionFormData]) continue;
    fields[field as keyof PositionFormData] = issue.message;
  }
  return fields;
}

export function validatePositionForm(
  form: PositionFormData,
  mode: PositionFormMode
):
  | { success: true; data: PositionCreateData | PositionEditData }
  | { success: false; errors: PositionFieldErrors } {
  const schema = mode === "create" ? positionCreateSchema : positionEditSchema;
  const parsed = schema.safeParse(form);

  if (!parsed.success) {
    return { success: false, errors: toFieldErrors(parsed.error) };
  }

  return { success: true, data: parsed.data };
}
