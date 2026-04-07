import { ref } from "vue";
import { notifyError } from "@/helpers/notify";
import { parseApiValidationResponse, pickToastMessage } from "@/helpers/map-laravel-errors";

export type FormFieldErrors = Record<string, string>;

export interface UseFormValidationErrorsOptions {
  /** Ordem para a mensagem do toast quando há erros por campo */
  toastFieldPriority?: string[];
  /** Quando a API não devolve erros estruturados nem `msg` útil */
  fallbackMessage?: string;
  /** Incrementar `submitAttempt` em erros da API (ex.: mudar separadores) */
  bumpSubmitAttemptOnApiError?: boolean;
  /** Incrementar `submitAttempt` em falha de validação no cliente */
  bumpSubmitAttemptOnClientValidation?: boolean;
  /** Toast com a primeira mensagem de campo (default: true) */
  notifyOnApiFieldErrors?: boolean;
  /** Toast quando só existe `msg` / `message` sem `errors` */
  notifyOnGenericApiMessage?: boolean;
  /** Se false, não mostra `fallbackMessage` quando o corpo não tem erros nem mensagem */
  notifyOnEmptyResponse?: boolean;
}

const DEFAULT_CLIENT_TOAST = "Corrija os campos indicados antes de salvar.";

export function useFormValidationErrors(options: UseFormValidationErrorsOptions = {}) {
  const {
    toastFieldPriority = [],
    fallbackMessage = "Não foi possível salvar. Tente novamente.",
    bumpSubmitAttemptOnApiError = false,
    bumpSubmitAttemptOnClientValidation = false,
    notifyOnApiFieldErrors = true,
    notifyOnGenericApiMessage = true,
    notifyOnEmptyResponse = true,
  } = options;

  const errors = ref<FormFieldErrors>({});
  const submitAttempt = ref(0);

  function clearError(field: string) {
    if (!errors.value[field]) return;
    const next = { ...errors.value };
    delete next[field];
    errors.value = next;
  }

  function resetErrors() {
    errors.value = {};
  }

  function bumpSubmitAttempt() {
    submitAttempt.value += 1;
  }

  type ClientToastArg = string | { toastMessage?: string; silent?: boolean };

  function onClientValidationFailed(fieldErrors: FormFieldErrors, toastOrOptions?: ClientToastArg) {
    errors.value = fieldErrors;
    if (bumpSubmitAttemptOnClientValidation) submitAttempt.value += 1;
    const opts = typeof toastOrOptions === "string" ? { toastMessage: toastOrOptions } : toastOrOptions ?? {};
    if (opts.silent) return;
    notifyError(opts.toastMessage ?? DEFAULT_CLIENT_TOAST);
  }

  function onApiError(err: unknown) {
    const axiosErr = err as { response?: { data?: unknown } };
    const parsed = parseApiValidationResponse(axiosErr.response?.data);

    if (parsed.fieldErrors) {
      errors.value = parsed.fieldErrors;
      if (bumpSubmitAttemptOnApiError) submitAttempt.value += 1;
      if (notifyOnApiFieldErrors) {
        const msg = pickToastMessage(parsed.fieldErrors, toastFieldPriority);
        if (msg) notifyError(msg);
      }
      return;
    }
    if (parsed.messageOnly && notifyOnGenericApiMessage) {
      notifyError(parsed.messageOnly);
      return;
    }
    if (notifyOnEmptyResponse && fallbackMessage) notifyError(fallbackMessage);
  }

  return {
    errors,
    submitAttempt,
    clearError,
    resetErrors,
    bumpSubmitAttempt,
    onClientValidationFailed,
    onApiError,
  };
}
