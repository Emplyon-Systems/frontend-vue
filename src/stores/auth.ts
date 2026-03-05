import { defineStore } from "pinia";
import { ref, computed } from "vue";
import router from "@/router";
import type { User } from "@/types/auth";
import { AUTH_STORAGE_KEYS } from "@/helpers/constants";

export interface AuthContext {
  company_id: number;
  branch_id?: number | null;
  company_name?: string;
  branch_name?: string;
  label: string;
}

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const activeContext = ref<AuthContext | null>(null);

  /** Inicializa a partir do sessionStorage (ao carregar a app) */
  function hydrate() {
    try {
      const rawUser = sessionStorage.getItem(AUTH_STORAGE_KEYS.USER);
      const rawToken = sessionStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
      const rawContext = sessionStorage.getItem(AUTH_STORAGE_KEYS.ACTIVE_CONTEXT);
      if (rawUser) user.value = JSON.parse(rawUser) as User;
      if (rawToken) token.value = rawToken;
      if (rawContext) activeContext.value = JSON.parse(rawContext) as AuthContext;
    } catch {
      clearSession();
    }
  }

  function saveSession(newUser: User, newToken: string) {
    user.value = newUser;
    token.value = newToken;
    activeContext.value = null;
    sessionStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(newUser));
    sessionStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, newToken);
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.ACTIVE_CONTEXT);
  }

  function clearSession() {
    user.value = null;
    token.value = null;
    activeContext.value = null;
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.USER);
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.ACTIVE_CONTEXT);
  }

  /** Opções de contexto (empresas e filiais) para o utilizador. */
  function getContextOptions(): AuthContext[] {
    const u = user.value;
    if (!u) return [];
    const options: AuthContext[] = [];
    const seen = new Set<string>();

    for (const branch of u.branches ?? []) {
      const companyId = branch.company_id ?? branch.company?.id ?? 0;
      const companyName = branch.company?.name ?? "";
      const branchName = branch.name ?? "";
      const key = `b-${companyId}-${branch.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      options.push({
        company_id: companyId,
        branch_id: branch.id,
        company_name: companyName,
        branch_name: branchName,
        label: companyName ? `${companyName} - ${branchName}` : branchName,
      });
    }

    for (const company of u.companies ?? []) {
      const key = `c-${company.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      options.push({
        company_id: company.id,
        branch_id: null,
        company_name: company.name,
        branch_name: undefined,
        label: company.name ?? `Empresa #${company.id}`,
      });
    }

    return options.sort((a, b) => a.label.localeCompare(b.label));
  }

  function hasMultipleContexts(): boolean {
    return getContextOptions().length > 1;
  }

  function selectContext(ctx: AuthContext) {
    activeContext.value = ctx;
    sessionStorage.setItem(AUTH_STORAGE_KEYS.ACTIVE_CONTEXT, JSON.stringify(ctx));
  }

  function getActiveContextLabel(): string {
    if (activeContext.value) return activeContext.value.label;
    const opts = getContextOptions();
    if (opts.length === 1) return opts[0].label;
    return "";
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
    activeContext,
    isAuthenticated,
    hydrate,
    saveSession,
    clearSession,
    getContextOptions,
    hasMultipleContexts,
    selectContext,
    getActiveContextLabel,
    hasRole,
    hasPermission,
    can,
    logout,
  };
});
