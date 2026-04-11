import { defineStore } from "pinia";
import { ref, computed } from "vue";
import router from "@/router";
import type { Permission, Role, User } from "@/types/auth";
import { AUTH_STORAGE_KEYS } from "@/helpers/constants";

/**
 * Remove listas aninhadas `role.permissions` (login superadmin pode trazer milhares de linhas).
 * Mantém permissões deduplicadas em `user.permissions` para hasPermission / menu / guards.
 * Evita localStorage gigante, JSON.parse lento e reatividade Vue pesada (freeze do browser).
 */
function slimUserForSession(user: User): User {
  const seen = new Set<string>();
  const flat: Permission[] = [];
  const takePerm = (p: Permission) => {
    if (!p.slug || seen.has(p.slug)) return;
    seen.add(p.slug);
    flat.push({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
    });
  };
  for (const p of user.permissions ?? []) takePerm(p);
  for (const r of user.roles ?? []) {
    for (const p of r.permissions ?? []) takePerm(p);
  }
  const slimRoles: Role[] = (user.roles ?? []).map((r) => {
    const { permissions: _nested, ...rest } = r;
    return rest;
  });
  return {
    ...user,
    roles: slimRoles,
    permissions: flat,
  };
}

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

  const sameContext = (a: AuthContext | null | undefined, b: AuthContext | null | undefined) =>
    !!a && !!b && a.company_id === b.company_id && (a.branch_id ?? null) === (b.branch_id ?? null);

  function clearActiveContext() {
    activeContext.value = null;
    localStorage.removeItem(AUTH_STORAGE_KEYS.ACTIVE_CONTEXT);
  }

  function syncActiveContext(options: AuthContext[]) {
    if (!options.length) {
      clearActiveContext();
      return;
    }

    if (activeContext.value) {
      const stillValid = options.some((ctx) => sameContext(ctx, activeContext.value));
      if (!stillValid) {
        clearActiveContext();
      } else {
        const canonical = options.find((ctx) => sameContext(ctx, activeContext.value));
        if (canonical) {
          activeContext.value = canonical;
          localStorage.setItem(AUTH_STORAGE_KEYS.ACTIVE_CONTEXT, JSON.stringify(canonical));
        }
      }
    }

    if (!activeContext.value && options.length === 1) {
      activeContext.value = options[0];
      localStorage.setItem(AUTH_STORAGE_KEYS.ACTIVE_CONTEXT, JSON.stringify(options[0]));
    }
  }

  /** Copia sessão antiga (sessionStorage) para localStorage, uma vez por browser. */
  function migrateAuthFromSessionStorage() {
    if (localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN)) return;
    const tok = sessionStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
    if (!tok) return;
    const u = sessionStorage.getItem(AUTH_STORAGE_KEYS.USER);
    const ctx = sessionStorage.getItem(AUTH_STORAGE_KEYS.ACTIVE_CONTEXT);
    if (u) localStorage.setItem(AUTH_STORAGE_KEYS.USER, u);
    localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, tok);
    if (ctx) localStorage.setItem(AUTH_STORAGE_KEYS.ACTIVE_CONTEXT, ctx);
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.USER);
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.ACTIVE_CONTEXT);
  }

  let storageListenerRegistered = false;

  /** Quando outra guia faz logout (remove token), esta guia alinha o estado. */
  function registerCrossTabAuthSync() {
    if (storageListenerRegistered || typeof window === "undefined") return;
    storageListenerRegistered = true;
    window.addEventListener("storage", (e) => {
      if (e.key !== AUTH_STORAGE_KEYS.TOKEN) return;
      if (e.newValue !== null) return;
      clearSession();
      if (router.currentRoute.value.matched.some((r) => r.meta.authRequired)) {
        router.replace({ name: "auth.sign-in" });
      }
    });
  }

  /** Inicializa a partir do localStorage (ao carregar a app; partilhado entre guias) */
  function hydrate() {
    migrateAuthFromSessionStorage();
    registerCrossTabAuthSync();
    try {
      const rawUser = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
      const rawToken = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
      const rawContext = localStorage.getItem(AUTH_STORAGE_KEYS.ACTIVE_CONTEXT);
      if (rawUser) {
        const parsed = JSON.parse(rawUser) as User;
        user.value = slimUserForSession(parsed);
        localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user.value));
      }
      if (rawToken) token.value = rawToken;
      if (rawContext) activeContext.value = JSON.parse(rawContext) as AuthContext;
      getContextOptions();
    } catch {
      clearSession();
    }
  }

  function saveSession(newUser: User, newToken: string) {
    const slim = slimUserForSession(newUser);
    user.value = slim;
    token.value = newToken;
    activeContext.value = null;
    localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(slim));
    localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, newToken);
    localStorage.removeItem(AUTH_STORAGE_KEYS.ACTIVE_CONTEXT);
  }

  function clearSession() {
    user.value = null;
    token.value = null;
    clearActiveContext();
    localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
    localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
  }

  /** Opções de contexto (empresas e filiais) para o usuário. */
  function getContextOptions(): AuthContext[] {
    const u = user.value;
    if (!u) return [];
    const options: AuthContext[] = [];
    const seen = new Set<string>();
    const companyMap = new Map<number, string>();
    const branchMap = new Map<number, { name: string; company_id?: number }>();

    for (const company of u.companies ?? []) {
      if (!company?.id) continue;
      companyMap.set(company.id, company.name ?? `Empresa #${company.id}`);
    }
    for (const branch of u.branches ?? []) {
      if (!branch?.id) continue;
      branchMap.set(branch.id, {
        name: branch.name ?? `Filial #${branch.id}`,
        company_id: branch.company_id ?? branch.company?.id,
      });
    }

    const addBranchContext = (companyId: number, branchId: number, companyName?: string, branchName?: string) => {
      if (!Number.isFinite(branchId) || branchId <= 0) return;
      const key = `b-${companyId}-${branchId}`;
      if (seen.has(key)) return;
      seen.add(key);
      const mappedBranch = branchMap.get(branchId);
      const mappedCompanyName = companyMap.get(companyId);
      const finalCompanyName = (companyName ?? mappedCompanyName ?? "").trim();
      const finalBranchName = (branchName ?? mappedBranch?.name ?? `Filial #${branchId}`).trim();
      options.push({
        company_id: companyId,
        branch_id: branchId,
        company_name: finalCompanyName || undefined,
        branch_name: finalBranchName,
        label: finalCompanyName ? `${finalCompanyName} - ${finalBranchName}` : finalBranchName,
      });
    };

    const addCompanyContext = (companyId: number, companyName?: string) => {
      if (!Number.isFinite(companyId) || companyId <= 0) return;
      const key = `c-${companyId}`;
      if (seen.has(key)) return;
      seen.add(key);
      const finalCompanyName = (companyName ?? companyMap.get(companyId) ?? `Empresa #${companyId}`).trim();
      options.push({
        company_id: companyId,
        branch_id: null,
        company_name: finalCompanyName,
        branch_name: undefined,
        label: finalCompanyName,
      });
    };

    for (const branch of u.branches ?? []) {
      const branchId = Number(branch.id ?? 0);
      const companyId = Number(branch.company_id ?? branch.company?.id ?? 0);
      addBranchContext(companyId, branchId, branch.company?.name, branch.name);
    }

    for (const company of u.companies ?? []) {
      addCompanyContext(Number(company.id ?? 0), company.name);
    }

    // Fallback por escopo dos perfis (quando vínculos company/branch não vierem completos).
    for (const role of u.roles ?? []) {
      const roleCompanyId = Number(role.company_id ?? 0);
      const roleBranchId = Number(role.branch_id ?? 0);
      if (roleBranchId > 0) {
        const mappedBranch = branchMap.get(roleBranchId);
        const companyId = roleCompanyId || Number(mappedBranch?.company_id ?? 0);
        addBranchContext(companyId, roleBranchId, companyMap.get(companyId), mappedBranch?.name);
      } else if (roleCompanyId > 0) {
        addCompanyContext(roleCompanyId, companyMap.get(roleCompanyId));
      }

      const slug = String(role.slug ?? "");
      const branchMatch = slug.match(/-b(\d+)$/);
      if (branchMatch) {
        const branchId = Number(branchMatch[1]);
        const mappedBranch = branchMap.get(branchId);
        const companyId = Number(mappedBranch?.company_id ?? roleCompanyId ?? 0);
        addBranchContext(companyId, branchId, companyMap.get(companyId), mappedBranch?.name);
      }
      const companyMatch = slug.match(/-c(\d+)$/);
      if (companyMatch) {
        const companyId = Number(companyMatch[1]);
        addCompanyContext(companyId, companyMap.get(companyId));
      }
    }

    const sorted = options.sort((a, b) => a.label.localeCompare(b.label));
    syncActiveContext(sorted);
    return sorted;
  }

  function hasMultipleContexts(): boolean {
    return getContextOptions().length > 1;
  }

  function selectContext(ctx: AuthContext) {
    activeContext.value = ctx;
    localStorage.setItem(AUTH_STORAGE_KEYS.ACTIVE_CONTEXT, JSON.stringify(ctx));
  }

  function getActiveContextLabel(): string {
    if (activeContext.value) return activeContext.value.label;
    const opts = getContextOptions();
    if (opts.length === 1) return opts[0].label;
    return "";
  }

  const isAuthenticated = computed(() => !!token.value && !!user.value);

  /** Verifica se o usuário tem o role (por slug). Alinhado ao backend: hasRole(string) */
  function hasRole(roleSlug: string): boolean {
    if (!user.value?.roles?.length) return false;
    return user.value.roles.some((r) => r.slug === roleSlug);
  }

  /** Verifica se o usuário tem a permissão (por slug), via algum dos seus roles. Alinhado ao backend: hasPermissionTo(string) */
  function hasPermission(permissionSlug: string): boolean {
    const hasDirect = (user.value?.permissions ?? []).some((p) => p.slug === permissionSlug);
    if (hasDirect) return true;
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
