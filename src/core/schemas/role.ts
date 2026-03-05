import { z } from "zod";

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} é obrigatório.`)
    .max(max, `${label} deve ter no máximo ${max} caracteres.`);

export const roleFormSchema = z.object({
  name: requiredText("Nome", 255),
  slug: requiredText("Slug", 255),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  permissions: z.array(z.number()).default([]),
});

export type RoleFormData = z.input<typeof roleFormSchema>;
export type RoleFormDataOutput = z.output<typeof roleFormSchema>;
export type RoleFieldErrors = Partial<Record<keyof RoleFormData, string>>;

export function roleInitialForm(): RoleFormData {
  return { name: "", slug: "", description: "", permissions: [] };
}

function toFieldErrors(error: z.ZodError): RoleFieldErrors {
  const fields: RoleFieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string" || fields[field as keyof RoleFormData]) continue;
    fields[field as keyof RoleFormData] = issue.message;
  }
  return fields;
}

export function validateRoleForm(
  form: RoleFormData
): { success: true; data: RoleFormDataOutput } | { success: false; errors: RoleFieldErrors } {
  const parsed = roleFormSchema.safeParse(form);

  if (!parsed.success) {
    return { success: false, errors: toFieldErrors(parsed.error) };
  }

  return { success: true, data: parsed.data };
}
