const setTitle = (title: string) => {
  return title
    ? `${title} | Emplyon`
    : "Emplyon";
};

const authRoutes = [
  {
    path: "/auth/sign-in",
    name: "auth.sign-in",
    meta: {
      title: setTitle("Entrar"),
    },
    component: () => import("@/views/auth/login.vue"),
  },
  {
    path: "/auth/register",
    name: "auth.register",
    meta: {
      title: setTitle("Registo"),
    },
    component: () => import("@/views/auth/register.vue"),
  },
  {
    path: "/auth/reset-pass",
    name: "auth.reset-pass",
    meta: {
      title: setTitle("Recuperar palavra-passe"),
    },
    component: () => import("@/views/auth/reset-pass.vue"),
  },
  {
    path: "/auth/error-404",
    name: "error.404",
    meta: {
      title: setTitle("Página não encontrada"),
    },
    component: () => import("@/views/auth/error-404.vue"),
  },
  {
    path: "/auth/error-500",
    name: "error.500",
    meta: {
      title: setTitle("Erro do servidor"),
    },
    component: () => import("@/views/auth/error-500.vue"),
  },
];

/** Rotas dos painéis: owner (super), company, employee */
const panelRoutes = [
  {
    path: "/",
    name: "panels.owner.dashboard",
    meta: {
      title: setTitle("Dashboard Owner"),
      authRequired: true,
    },
    component: () => import("@/views/panels/owner/dashboard/index.vue"),
  },
  {
    path: "/users",
    name: "owner.users",
    meta: {
      title: setTitle("Utilizadores"),
      authRequired: true,
    },
    component: () => import("@/views/panels/owner/users/index.vue"),
  },
  {
    path: "/users/create",
    name: "owner.users.create",
    meta: {
      title: setTitle("Novo utilizador"),
      authRequired: true,
    },
    component: () => import("@/views/panels/owner/users/create.vue"),
  },
  {
    path: "/users/:id/edit",
    name: "owner.users.edit",
    meta: {
      title: setTitle("Editar utilizador"),
      authRequired: true,
    },
    component: () => import("@/views/panels/owner/users/edit.vue"),
  },
  {
    path: "/roles",
    name: "owner.roles",
    meta: {
      title: setTitle("Perfis"),
      authRequired: true,
    },
    component: () => import("@/views/panels/owner/roles/index.vue"),
  },
  {
    path: "/roles/:id",
    name: "owner.roles.form",
    meta: {
      title: setTitle("Perfil"),
      authRequired: true,
    },
    component: () => import("@/views/panels/owner/roles/[id].vue"),
  },
  {
    path: "/permissions",
    name: "owner.permissions",
    meta: {
      title: setTitle("Permissões"),
      authRequired: true,
    },
    component: () => import("@/views/panels/owner/permissions/index.vue"),
  },
  {
    path: "/audits",
    name: "owner.audits",
    meta: {
      title: setTitle("Auditoria"),
      authRequired: true,
    },
    component: () => import("@/views/panels/owner/audits/index.vue"),
  },
  {
    path: "/audits/:id",
    name: "owner.audits.show",
    meta: {
      title: setTitle("Detalhe da auditoria"),
      authRequired: true,
    },
    component: () => import("@/views/panels/owner/audits/show.vue"),
  },
  {
    path: "/company",
    name: "panels.company.dashboard",
    meta: {
      title: setTitle("Dashboard Empresa"),
      authRequired: true,
    },
    component: () => import("@/views/panels/company/dashboard/index.vue"),
  },
  {
    path: "/branch",
    name: "panels.branch.dashboard",
    meta: {
      title: setTitle("Dashboard Filial"),
      authRequired: true,
      role: ["branch_manager", "branch", "filial"],
    },
    component: () => import("@/views/panels/branch/dashboard/index.vue"),
  },
  {
    path: "/employee",
    name: "panels.employee.dashboard",
    meta: {
      title: setTitle("Dashboard Colaborador"),
      authRequired: true,
    },
    component: () => import("@/views/panels/employee/dashboard/index.vue"),
  },
];

const errorRoutes = [
  {
    path: "/:catchAll(.*)",
    redirect: "/auth/error-404",
  },
];

export const allRoute = [
  ...authRoutes,
  ...panelRoutes,
  ...errorRoutes,
];
