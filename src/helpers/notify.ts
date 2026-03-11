import { useNotifyStore } from "@/stores/notify";

/**
 * Mostra uma notificação de sucesso usando o componente AppAlert (Default Alerts).
 * Fecha automaticamente após alguns segundos.
 */
export function notifySuccess(message: string, title = "Sucesso"): void {
  useNotifyStore().add({ variant: "success", title, message });
}

/**
 * Mostra uma notificação de erro usando o componente AppAlert.
 */
export function notifyError(message: string, title = "Erro"): void {
  useNotifyStore().add({ variant: "danger", title, message });
}

/**
 * Mostra uma notificação de aviso usando o componente AppAlert.
 */
export function notifyWarning(message: string, title = "Aviso"): void {
  useNotifyStore().add({ variant: "warning", title, message });
}

/**
 * Mostra uma notificação informativa usando o componente AppAlert.
 */
export function notifyInfo(message: string, title = "Informação"): void {
  useNotifyStore().add({ variant: "info", title, message });
}
