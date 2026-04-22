import { z } from "zod";

/**
 * EXEMPLO de schema para formulários.
 *
 * Estrutura recomendada por módulo:
 * 1) Helpers de validação reutilizáveis.
 * 2) Schema base do formulário.
 * 3) Schemas por modo (create/edit).
 * 4) Tipos derivados do Zod (input/output).
 * 5) Estado inicial do formulário.
 * 6) Função única de validação com retorno padronizado.
 */

/** Texto obrigatório com trim + tamanho máximo + mensagens amigáveis. */
const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} é obrigatório.`)
    .max(max, `${label} deve ter no máximo ${max} caracteres.`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === "" ? undefined : v));

/** Schema base do form: descreve os campos comuns de create/edit. */
const exampleBaseSchema = z.object({
  name: requiredText("Nome", 255),
  description: optionalText(500),
  active: z.boolean().optional(),
});

/** Regras de criação (quando create tiver regra extra, adicione aqui). */
export const exampleCreateSchema = exampleBaseSchema;

/** Regras de edição (permite ajustes específicos do modo edit). */
export const exampleEditSchema = exampleBaseSchema.partial().extend({
  name: requiredText("Nome", 255),
});

/** Tipos derivados dos schemas para manter tipagem sincronizada com validação. */
export type ExampleFormData = z.input<typeof exampleBaseSchema>;
export type ExampleCreateData = z.output<typeof exampleCreateSchema>;
export type ExampleEditData = z.output<typeof exampleEditSchema>;
export type ExampleFormMode = "create" | "edit";
export type ExampleFieldErrors = Partial<Record<keyof ExampleFormData, string>>;

/** Estado inicial padrão usado para iniciar/resetar o formulário. */
export function exampleInitialForm(): ExampleFormData {
  return {
    name: "",
    description: "",
    active: true,
  };
}

function toFieldErrors(error: z.ZodError): ExampleFieldErrors {
  const fields: ExampleFieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") as keyof ExampleFieldErrors;
    if (fields[key]) continue;
    fields[key] = issue.message;
  }
  return fields;
}

/**
 * Validador central do módulo:
 * - escolhe schema por modo (create/edit)
 * - valida com safeParse
 * - retorna sucesso com dados parseados OU erros por campo
 */
export function validateExampleForm(
  form: ExampleFormData,
  mode: ExampleFormMode,
):
  | { success: true; data: ExampleCreateData | ExampleEditData }
  | { success: false; errors: ExampleFieldErrors } {
  const schema = mode === "create" ? exampleCreateSchema : exampleEditSchema;
  const parsed = schema.safeParse(form);

  if (!parsed.success) {
    return { success: false, errors: toFieldErrors(parsed.error) };
  }

  return { success: true, data: parsed.data };
}
