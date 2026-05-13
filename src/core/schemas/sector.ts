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
  start_time: z.string().trim().min(1, "Horário de início é obrigatório."),
  end_time: z.string().trim().min(1, "Horário de término é obrigatório."),
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
  start_time: "08:00",
  end_time: "17:00",
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

  if (parsed.data.end_time <= parsed.data.start_time) {
    return {
      success: false,
      errors: {
        end_time: "Horário de término deve ser maior que o horário de início.",
      },
    };
  }

  return { success: true, data: parsed.data };
}
