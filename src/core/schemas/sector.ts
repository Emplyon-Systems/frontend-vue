import { z } from "zod";

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} é obrigatório.`)
    .max(max, `${label} deve ter no máximo ${max} caracteres.`);

const sectorBaseSchema = z.object({
  branch_id: z.number({ required_error: "Filial é obrigatória." }).int().positive("Filial é obrigatória."),
  name: requiredText("Nome", 255),
});

export const sectorCreateSchema = sectorBaseSchema;
export const sectorEditSchema = sectorBaseSchema;

export type SectorFormData = z.input<typeof sectorCreateSchema>;
export type SectorCreateData = z.output<typeof sectorCreateSchema>;
export type SectorEditData = z.output<typeof sectorEditSchema>;
export type SectorFormMode = "create" | "edit";
export type SectorFieldErrors = Partial<Record<keyof SectorFormData, string>>;

export const sectorInitialForm = (): SectorFormData => ({
  branch_id: 0,
  name: "",
});

function toFieldErrors(error: z.ZodError): SectorFieldErrors {
  const fields: SectorFieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string" || fields[field as keyof SectorFormData]) continue;
    fields[field as keyof SectorFormData] = issue.message;
  }
  return fields;
}

export function validateSectorForm(
  form: SectorFormData,
  mode: SectorFormMode
):
  | { success: true; data: SectorCreateData | SectorEditData }
  | { success: false; errors: SectorFieldErrors } {
  const schema = mode === "create" ? sectorCreateSchema : sectorEditSchema;
  const parsed = schema.safeParse(form);

  if (!parsed.success) {
    return { success: false, errors: toFieldErrors(parsed.error) };
  }

  return { success: true, data: parsed.data };
}
