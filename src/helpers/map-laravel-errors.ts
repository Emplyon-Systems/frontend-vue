/** Converte `errors` da API (por campo, lista plana ou string) para `campo → primeira mensagem`. */
export function laravelErrorsToFieldMap(errors: unknown): Record<string, string> | null {
  if (errors == null) return null;
  if (typeof errors === "string") {
    const t = errors.trim();
    return t ? { general: t } : null;
  }
  if (Array.isArray(errors)) {
    const first = errors.find((x) => x != null && String(x).trim() !== "");
    return first != null ? { general: String(first) } : null;
  }
  if (typeof errors !== "object") return null;
  const map: Record<string, string> = {};
  for (const [k, v] of Object.entries(errors as Record<string, unknown>)) {
    map[k] = Array.isArray(v) ? String(v[0] ?? "") : String(v ?? "");
  }
  return Object.keys(map).length ? map : null;
}

const DEFAULT_TOAST_TAIL = ["general", "error", "company", "profile"] as const;

/** Escolhe uma mensagem para toast a partir do mapa (prioridade + chaves comuns). */
export function pickToastMessage(map: Record<string, string>, priorityKeys: string[] = []): string | undefined {
  for (const k of priorityKeys) {
    const v = map[k];
    if (v) return v;
  }
  for (const k of DEFAULT_TOAST_TAIL) {
    const v = map[k];
    if (v) return v;
  }
  const vals = Object.values(map);
  return vals[0];
}

/** Interpreta o corpo JSON típico de erro de validação da API (Laravel / ResponseHelper). */
export function parseApiValidationResponse(data: unknown): {
  fieldErrors: Record<string, string> | null;
  /** Só mensagem (ex.: `msg` sem `errors`) */
  messageOnly?: string;
} {
  if (data == null || typeof data !== "object") {
    return { fieldErrors: null };
  }
  const d = data as Record<string, unknown>;
  const fieldErrors = laravelErrorsToFieldMap(d.errors);
  if (fieldErrors) {
    return { fieldErrors };
  }
  const msg = d.msg;
  if (typeof msg === "string" && msg.length && msg !== "fail") {
    return { fieldErrors: null, messageOnly: msg };
  }
  const message = d.message;
  if (typeof message === "string" && message.length) {
    return { fieldErrors: null, messageOnly: message };
  }
  return { fieldErrors: null };
}
