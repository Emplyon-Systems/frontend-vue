import { defineStore } from "pinia";
import { ref } from "vue";

export type NotifyVariant = "success" | "danger" | "warning" | "info";

export interface NotifyItem {
  id: number;
  variant: NotifyVariant;
  title: string;
  message: string;
}

const DEFAULT_DURATION_MS = 2800;

export const useNotifyStore = defineStore("notify", () => {
  const items = ref<NotifyItem[]>([]);
  let nextId = 0;
  const timeouts = new Map<number, ReturnType<typeof setTimeout>>();

  function add(payload: {
    variant?: NotifyVariant;
    title?: string;
    message: string;
    duration?: number;
  }) {
    const id = ++nextId;
    const variant = payload.variant ?? "success";
    const title = payload.title ?? (variant === "success" ? "Sucesso" : variant === "danger" ? "Erro" : "Aviso");
    const duration = payload.duration ?? DEFAULT_DURATION_MS;

    items.value = [...items.value, { id, variant, title, message: payload.message }];

    const t = setTimeout(() => {
      timeouts.delete(id);
      remove(id);
    }, duration);
    timeouts.set(id, t);
  }

  function remove(id: number) {
    const t = timeouts.get(id);
    if (t) clearTimeout(t);
    timeouts.delete(id);
    items.value = items.value.filter((item) => item.id !== id);
  }

  return { items, add, remove };
});
