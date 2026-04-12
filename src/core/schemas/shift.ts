import { z } from "zod";

/** Nomes padrão de turno (single select no formulário). */
export const SHIFT_NAMES = ["Manhã", "Tarde", "Noite"] as const;
export type ShiftName = (typeof SHIFT_NAMES)[number];

const shiftNameSchema = z.enum(SHIFT_NAMES, {
  errorMap: () => ({ message: "Selecione Manhã, Tarde ou Noite." }),
});

const timeSchema = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Formato inválido (use HH:mm)");

/** Converte HH:mm:ss para HH:mm (backend espera H:i). */
function toHhMm(time: string): string {
  const m = String(time ?? "").match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "08:00";
}

/** Slug é gerado no backend via observer a partir do nome. Não enviamos no request. */
const shiftBaseSchema = z.object({
  branch_id: z.number({ required_error: "Filial é obrigatória." }).int().positive("Filial é obrigatória."),
  name: shiftNameSchema,
  slug: z.string().max(255).optional(),
  start_time: timeSchema,
  end_time: timeSchema,
});

export const shiftCreateSchema = shiftBaseSchema.omit({ slug: true });
export const shiftEditSchema = shiftBaseSchema.omit({ slug: true });

/** FormData inclui slug para exibição (edit/view); validação omite slug — backend gera. */
export type ShiftFormData = z.input<typeof shiftBaseSchema>;
export type ShiftCreateData = z.output<typeof shiftCreateSchema>;
export type ShiftEditData = z.output<typeof shiftEditSchema>;
export type ShiftFormMode = "create" | "edit";
export type ShiftFieldErrors = Partial<Record<keyof ShiftFormData, string>>;

export const shiftInitialForm = (): ShiftFormData => ({
  branch_id: 0,
  name: "Manhã",
  slug: "", // Apenas para exibição; o backend gera a partir do nome
  start_time: "08:00",
  end_time: "17:00",
});

function toFieldErrors(error: z.ZodError): ShiftFieldErrors {
  const fields: ShiftFieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string" || fields[field as keyof ShiftFormData]) continue;
    fields[field as keyof ShiftFormData] = issue.message;
  }
  return fields;
}

export function validateShiftForm(
  form: ShiftFormData,
  mode: ShiftFormMode
):
  | { success: true; data: ShiftCreateData | ShiftEditData }
  | { success: false; errors: ShiftFieldErrors } {
  const schema = mode === "create" ? shiftCreateSchema : shiftEditSchema;
  const parsed = schema.safeParse(form);

  if (!parsed.success) {
    return { success: false, errors: toFieldErrors(parsed.error) };
  }

  const data = parsed.data as ShiftCreateData | ShiftEditData;
  return {
    success: true,
    data: {
      ...data,
      start_time: toHhMm(data.start_time),
      end_time: toHhMm(data.end_time),
    },
  };
}
