import { createRouter, createWebHistory, type RouteLocationRaw } from "vue-router";
import { allRoute } from "@/router/routes";
import { useAuthStore } from "@/stores/auth";
import { getPanelHomeForUser } from "@/config/panels";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: allRoute,
});

/**
 * Guards sem callback `next()` (API recomendada no Vue Router 4).
 * Evita promessas de navegação que nunca resolvem quando se mistura `async` com `return next()`.
 */
router.beforeEach(async (to, _from) => {
  const title = to.meta.title;
  if (title) {
    document.title = title.toString();
  }

  const authRequired = to.matched.some((r) => r.meta.authRequired);
  const auth = useAuthStore();

  if (authRequired && !auth.isAuthenticated) {
    return {
      name: "auth.sign-in",
      query: { redirectedFrom: to.fullPath },
    } satisfies RouteLocationRaw;
  }

  const isSelectContext = to.name === "auth.select-context";
  if (
    authRequired &&
    auth.isAuthenticated &&
    !isSelectContext &&
    !auth.hasRole("superadmin") &&
    auth.hasMultipleContexts() &&
    !auth.activeContext
  ) {
    return { name: "auth.select-context" } satisfies RouteLocationRaw;
  }

  const panelOwner = to.matched.some((r) => r.meta.panel === "owner");
  if (authRequired && auth.isAuthenticated && panelOwner && !auth.hasRole("superadmin")) {
    return (getPanelHomeForUser(auth.user ?? undefined, auth.activeContext) || "/employee") satisfies RouteLocationRaw;
  }

  const permission = to.meta.permission as string | string[] | undefined;
  const role = to.meta.role as string | string[] | undefined;
  const rolePrefix = to.meta.rolePrefix as string[] | undefined;
  if (auth.isAuthenticated && (permission || role || rolePrefix) && !auth.hasRole("superadmin")) {
    const perms = Array.isArray(permission) ? permission : permission ? [permission] : [];
    const roles = Array.isArray(role) ? role : role ? [role] : [];
    const prefixes = Array.isArray(rolePrefix) ? rolePrefix : [];
    const hasPerm = perms.some((p) => auth.can(`permission:${p}`));
    const hasRole = roles.some((r) => auth.can(`role:${r}`));
    const hasRoleByPrefix = prefixes.length > 0 && (auth.user?.roles ?? []).some((r) =>
      prefixes.some((p) => (r.slug ?? "").startsWith(p))
    );
    const allowsBranchScoped = prefixes.some((p) => p === "filial-b");
    const hasBranchScopedRole = allowsBranchScoped && (auth.user?.roles ?? []).some(
      (r) => /-b\d+$/.test(r.slug ?? "")
    );
    if (!hasPerm && !hasRole && !hasRoleByPrefix && !hasBranchScopedRole) {
      return { name: "error.403" } satisfies RouteLocationRaw;
    }
  }

  /** Listagens operacionais só fazem sentido no contexto filial — utilizador deve ir a Filiais → Ver. */
  const companyOperationalListRoutes = new Set([
    "company.sectors",
    "company.employees",
    "company.shifts",
    "company.modality-types",
    "company.scale-types",
  ]);
  if (
    auth.isAuthenticated &&
    companyOperationalListRoutes.has(String(to.name)) &&
    !String(to.name).startsWith("company.branch.")
  ) {
    return { name: "company.branches", replace: true } satisfies RouteLocationRaw;
  }

  if (to.name === "company.branches.create" && auth.isAuthenticated) {
    const companyId = Number(auth.user?.companies?.[0]?.id ?? 0);
    if (companyId > 0) {
      try {
        const { companiesApi } = await import("@/api/resources");
        const res = await companiesApi.getById(companyId);
        const c = res.company;
        if (c) {
          const used = c.branches_used ?? c.branches?.length ?? 0;
          const limit = c.branch_limit ?? 0;
          if (limit > 0 && used >= limit) {
            return { name: "company.branches", replace: true } satisfies RouteLocationRaw;
          }
        }
      } catch {
        // falha de rede: o backend valida na mesma
      }
    }
  }

  if (to.name === "owner.users.create" && auth.isAuthenticated && !auth.hasRole("superadmin")) {
    const companyId = Number(auth.activeContext?.company_id ?? 0);
    if (companyId > 0) {
      try {
        const { companiesApi } = await import("@/api/resources");
        const res = await companiesApi.getById(companyId);
        const c = res.company;
        if (c) {
          const used = c.users_used ?? c.users?.length ?? 0;
          const limit = c.user_limit ?? 0;
          if (limit > 0 && used >= limit) {
            return { name: "owner.users", replace: true } satisfies RouteLocationRaw;
          }
        }
      } catch {
        //
      }
    }
  }

  return true;
});

export default router;
