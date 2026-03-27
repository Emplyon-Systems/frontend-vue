import { createRouter, createWebHistory } from "vue-router";
import { allRoute } from "@/router/routes";
import { useAuthStore } from "@/stores/auth";
import { getPanelHomeForUser } from "@/config/panels";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: allRoute,
});

router.beforeEach(async (to, _from, next) => {
  const title = to.meta.title;
  if (title) {
    document.title = title.toString();
  }

  const authRequired = to.matched.some((r) => r.meta.authRequired);
  const auth = useAuthStore();

  if (authRequired && !auth.isAuthenticated) {
    return next({ name: "auth.sign-in", query: { redirectedFrom: to.fullPath } });
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
    return next({ name: "auth.select-context" });
  }

  const panelOwner = to.matched.some((r) => r.meta.panel === "owner");
  if (authRequired && auth.isAuthenticated && panelOwner && !auth.hasRole("superadmin")) {
    return next(getPanelHomeForUser(auth.user, auth.activeContext) || "/employee");
  }

  const permission = to.meta.permission as string | string[] | undefined;
  const role = to.meta.role as string | string[] | undefined;
  const rolePrefix = to.meta.rolePrefix as string[] | undefined;
  if (auth.isAuthenticated && (permission || role || rolePrefix)) {
    if (auth.hasRole("superadmin")) {
      return next();
    }
    const perms = Array.isArray(permission) ? permission : permission ? [permission] : [];
    const roles = Array.isArray(role) ? role : role ? [role] : [];
    const prefixes = Array.isArray(rolePrefix) ? rolePrefix : [];
    const hasPerm = perms.some((p) => auth.can(`permission:${p}`));
    const hasRole = roles.some((r) => auth.can(`role:${r}`));
    const hasRoleByPrefix = prefixes.length > 0 && (auth.user?.roles ?? []).some((r) =>
      prefixes.some((p) => (r.slug ?? "").startsWith(p))
    );
    // Aceita perfis com escopo de filial (ex.: assistente-b123) quando a rota permite filial-b*
    const allowsBranchScoped = prefixes.some((p) => p === "filial-b");
    const hasBranchScopedRole = allowsBranchScoped && (auth.user?.roles ?? []).some(
      (r) => /-b\d+$/.test(r.slug ?? "")
    );
    if (!hasPerm && !hasRole && !hasRoleByPrefix && !hasBranchScopedRole) {
      return next({ name: "error.403" });
    }
  }

  // Criação de filial no painel empresa: bloquear rota se o limite já foi atingido
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
            return next({ name: "company.branches", replace: true });
          }
        }
      } catch {
        // falha de rede: o backend valida na mesma
      }
    }
  }

  // Novo usuário (contexto empresa ou filial): mesmo limite da empresa — inclui quem só está ligado a filiais
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
            return next({ name: "owner.users", replace: true });
          }
        }
      } catch {
        //
      }
    }
  }

  return next();
});

export default router;
