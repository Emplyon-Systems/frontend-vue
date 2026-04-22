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

const scheduleRuleRowSchema = z
  .object({
    id: z.number().optional(),
    weekdays: z
      .array(z.number().int().min(1).max(7))
      .min(1, "Selecione pelo menos um dia da semana.")
      .refine((arr) => new Set(arr).size === arr.length, "Não repita o mesmo dia dentro da mesma regra."),
    is_closed: z.boolean(),
    expedient_start_time: z.string().optional(),
    expedient_end_time: z.string().optional(),
    store_open_time: z.string().optional(),
    store_close_time: z.string().optional(),
    break_duration_minutes: z.number().int().min(0).max(720).nullable().optional(),
    daily_work_minutes: z.number().int().min(0).max(1440).nullable().optional(),
    sort_order: z.number().int().min(0).optional(),
  })
  .superRefine((row, ctx) => {
    if (row.is_closed) return;
    const need: Array<keyof typeof row> = [
      "expedient_start_time",
      "expedient_end_time",
      "store_open_time",
      "store_close_time",
    ];
    for (const key of need) {
      const v = row[key];
      if (typeof v !== "string" || !v.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Obrigatório quando o período não está fechado.",
          path: [key],
        });
      }
    }
    if (!row.is_closed) {
      for (const key of need) {
        const v = row[key];
        if (typeof v === "string" && v.trim() && !/^\d{2}:\d{2}(:\d{2})?$/.test(v.trim())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Formato inválido (use HH:mm).",
            path: [key],
          });
        }
      }
    }
  });

function validateScheduleRulesCoverage(rules: z.infer<typeof scheduleRuleRowSchema>[], ctx: z.RefinementCtx) {
  const seen = new Set<number>();
  rules.forEach((rule, i) => {
    for (const d of rule.weekdays) {
      if (seen.has(d)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `O dia ${d} (1=seg … 7=dom) não pode repetir-se em mais do que uma regra.`,
          path: ["schedule_rules", i, "weekdays"],
        });
        return;
      }
      seen.add(d);
    }
  });
  for (let d = 1; d <= 7; d++) {
    if (!seen.has(d)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Tem de existir uma regra para cada dia (1=segunda … 7=domingo). Falta o dia ${d}.`,
        path: ["schedule_rules"],
      });
      return;
    }
  }
}

export const branchCreateSchema = branchBasicSchema;
export const branchOwnerEditSchema = branchBasicSchema;
export const branchManagerEditSchema = branchBasicSchema
  .extend({
    schedule_rules: z.array(scheduleRuleRowSchema).min(1, "Adicione pelo menos uma regra de horário."),
  })
  .superRefine((data, ctx) => validateScheduleRulesCoverage(data.schedule_rules, ctx));

export type BranchScheduleRuleFormRow = z.infer<typeof scheduleRuleRowSchema>;

export type BranchFormData = Omit<z.input<typeof branchManagerEditSchema>, "schedule_rules"> & {
  /** Painel dono: omitido. Gerente de filial: obrigatório na validação. */
  schedule_rules?: BranchScheduleRuleFormRow[];
  /** Legado / formulário antigo; não usado quando há schedule_rules. */
  expedient_start_time?: string;
  expedient_end_time?: string;
  store_open_time?: string;
  store_close_time?: string;
};

export type BranchFormMode = "create" | "edit" | "edit-with-hours";
export type BranchBasicPayload = z.output<typeof branchBasicSchema>;
export type BranchManagerPayload = z.output<typeof branchManagerEditSchema>;
export type BranchFieldErrors = Partial<Record<keyof BranchFormData | string, string>>;

/** Uma regra aberta para todos os dias (valor inicial / migração a partir dos campos legados). */
export function defaultOpenScheduleRuleAllWeek(): BranchScheduleRuleFormRow {
  return {
    weekdays: [1, 2, 3, 4, 5, 6, 7],
    is_closed: false,
    expedient_start_time: "08:00",
    expedient_end_time: "18:00",
    store_open_time: "09:00",
    store_close_time: "18:00",
    break_duration_minutes: null,
    daily_work_minutes: null,
    sort_order: 0,
  };
}

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
  schedule_rules: undefined,
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

function toFieldErrorsDeep(error: z.ZodError): BranchFieldErrors {
  const fields: BranchFieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "branch";
    if (!fields[key]) fields[key] = issue.message;
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
  if (mode === "edit-with-hours") {
    const candidate = { ...form, schedule_rules: form.schedule_rules ?? [] };
    const parsed = branchManagerEditSchema.safeParse(candidate);
    if (!parsed.success) {
      return { success: false, errors: toFieldErrorsDeep(parsed.error) };
    }
    const data = parsed.data;
    return {
      success: true,
      data: {
        ...data,
        schedule_rules: data.schedule_rules.map((r, i) => ({
          ...r,
          sort_order: r.sort_order ?? i,
          expedient_start_time: r.is_closed ? undefined : toHhMm(String(r.expedient_start_time ?? "")),
          expedient_end_time: r.is_closed ? undefined : toHhMm(String(r.expedient_end_time ?? "")),
          store_open_time: r.is_closed ? undefined : toHhMm(String(r.store_open_time ?? "")),
          store_close_time: r.is_closed ? undefined : toHhMm(String(r.store_close_time ?? "")),
        })),
      },
    };
  }

  const schema = mode === "create" ? branchCreateSchema : branchOwnerEditSchema;
  const parsed = schema.safeParse(form);

  if (!parsed.success) {
    return { success: false, errors: toFieldErrors(parsed.error) };
  }

  return { success: true, data: parsed.data };
}
