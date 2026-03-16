import { createRouter, createWebHistory } from "vue-router";
import { allRoute } from "@/router/routes";
import { useAuthStore } from "@/stores/auth";
import { getPanelHomeForUser } from "@/config/panels";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: allRoute,
});

router.beforeEach((to, _from, next) => {
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

  next();
});

export default router;
