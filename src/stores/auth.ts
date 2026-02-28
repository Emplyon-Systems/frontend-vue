import { defineStore } from "pinia";
import { ref, computed } from "vue";
import router from "@/router";
import type { User } from "@/types/auth";
import { AUTH_STORAGE_KEYS } from "@/helpers/constants";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);

  /** Inicializa a partir do sessionStorage (ao carregar a app) */
  function hydrate() {
    try {
      const rawUser = sessionStorage.getItem(AUTH_STORAGE_KEYS.USER);
      const rawToken = sessionStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
      if (rawUser) user.value = JSON.parse(rawUser) as User;
      if (rawToken) token.value = rawToken;
    } catch {
      clearSession();
    }
  }

  function saveSession(newUser: User, newToken: string) {
    user.value = newUser;
    token.value = newToken;
    sessionStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(newUser));
    sessionStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, newToken);
  }

  function clearSession() {
    user.value = null;
    token.value = null;
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.USER);
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
  }

  const isAuthenticated = computed(() => !!token.value && !!user.value);

  /** Verifica se o utilizador tem o role (por slug). Alinhado ao backend: hasRole(string) */
  function hasRole(roleSlug: string): boolean {
    if (!user.value?.roles?.length) return false;
    return user.value.roles.some((r) => r.slug === roleSlug);
  }

  /** Verifica se o utilizador tem a permissão (por slug), via algum dos seus roles. Alinhado ao backend: hasPermissionTo(string) */
  function hasPermission(permissionSlug: string): boolean {
    if (!user.value?.roles?.length) return false;
    return user.value.roles.some((role) =>
      role.permissions?.some((p) => p.slug === permissionSlug)
    );
  }

  /**
   * Verifica role ou permissão (para uso em guards e UI).
   * Uso: can('role:admin'), can('permission:users.index')
   */
  function can(ability: string): boolean {
    if (ability.startsWith("role:")) return hasRole(ability.slice(5));
    if (ability.startsWith("permission:")) return hasPermission(ability.slice(11));
    return hasPermission(ability);
  }

  function logout() {
    clearSession();
    router.push({ name: "auth.sign-in" });
  }

  return {
    user,
    token,
    isAuthenticated,
    hydrate,
    saveSession,
    clearSession,
    hasRole,
    hasPermission,
    can,
    logout,
  };
});
