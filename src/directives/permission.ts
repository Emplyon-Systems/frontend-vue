import type { DirectiveBinding } from "vue";
import { useAuthStore } from "@/stores/auth";

function checkPermission(permissions: string | string[]): boolean {
  const store = useAuthStore();
  const list = Array.isArray(permissions) ? permissions : [permissions];
  return list.some((p) => store.can(`permission:${p}`) || store.can(`role:${p}`));
}

/**
 * Directiva v-permission: remove o elemento do DOM se o usuário não tiver
 * nenhuma das permissões/roles indicadas.
 * Uso: v-permission="'users.index'" ou v-permission="['users.index', 'users.create']"
 */
export function permission(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
  const value = binding.value;
  if (value == null) return;
  const allowed = checkPermission(value);
  if (!allowed) {
    el.style.display = "none";
  } else {
    el.style.display = "";
  }
}

export default permission;
