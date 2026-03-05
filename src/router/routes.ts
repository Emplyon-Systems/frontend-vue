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
    path: "/auth/select-context",
    name: "auth.select-context",
    meta: {
      title: setTitle("Escolher contexto"),
      authRequired: true,
    },
    component: () => import("@/views/auth/select-context.vue"),
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
      panel: "owner",
    },
    component: () => import("@/views/panels/owner/dashboard/index.vue"),
  },
  {
    path: "/users",
    name: "owner.users",
    meta: {
      title: setTitle("Usuários"),
      authRequired: true,
      permission: ["users.index", "users.read"],
    },
    component: () => import("@/pages/panels/owner/users/index.vue"),
  },
  {
    path: "/users/create",
    name: "owner.users.create",
    meta: {
      title: setTitle("Novo utilizador"),
      authRequired: true,
      permission: "users.create",
    },
    component: () => import("@/pages/panels/owner/users/create.vue"),
  },
  {
    path: "/users/:id/edit",
    name: "owner.users.edit",
    meta: {
      title: setTitle("Editar utilizador"),
      authRequired: true,
      permission: "users.update",
    },
    component: () => import("@/pages/panels/owner/users/edit.vue"),
  },
  {
    path: "/users/:id",
    name: "owner.users.view",
    meta: {
      title: setTitle("Visualizar utilizador"),
      authRequired: true,
      permission: "users.read",
    },
    component: () => import("@/pages/panels/owner/users/view.vue"),
  },
  {
    path: "/companies",
    name: "owner.companies",
    meta: {
      title: setTitle("Empresas"),
      authRequired: true,
      panel: "owner",
      permission: ["companies.index", "companies.read"],
    },
    component: () => import("@/pages/panels/owner/companies/index.vue"),
  },
  {
    path: "/companies/create",
    name: "owner.companies.create",
    meta: {
      title: setTitle("Nova empresa"),
      authRequired: true,
      panel: "owner",
      permission: "companies.create",
    },
    component: () => import("@/pages/panels/owner/companies/create.vue"),
  },
  {
    path: "/companies/:id/edit",
    name: "owner.companies.edit",
    meta: {
      title: setTitle("Editar empresa"),
      authRequired: true,
      panel: "owner",
      permission: "companies.update",
    },
    component: () => import("@/pages/panels/owner/companies/edit.vue"),
  },
  {
    path: "/companies/:id",
    name: "owner.companies.view",
    meta: {
      title: setTitle("Visualizar empresa"),
      authRequired: true,
      panel: "owner",
      permission: "companies.read",
    },
    component: () => import("@/pages/panels/owner/companies/view.vue"),
  },
  {
    path: "/branches",
    name: "owner.branches",
    meta: {
      title: setTitle("Filiais"),
      authRequired: true,
      panel: "owner",
      permission: ["branches.index", "branches.read"],
    },
    component: () => import("@/pages/panels/owner/branches/index.vue"),
  },
  {
    path: "/branches/create",
    name: "owner.branches.create",
    meta: {
      title: setTitle("Nova filial"),
      authRequired: true,
      panel: "owner",
      permission: "branches.create",
    },
    component: () => import("@/pages/panels/owner/branches/create.vue"),
  },
  {
    path: "/branches/:id/edit",
    name: "owner.branches.edit",
    meta: {
      title: setTitle("Editar filial"),
      authRequired: true,
      panel: "owner",
      permission: "branches.update",
    },
    component: () => import("@/pages/panels/owner/branches/edit.vue"),
  },
  {
    path: "/branches/:id",
    name: "owner.branches.view",
    meta: {
      title: setTitle("Visualizar filial"),
      authRequired: true,
      panel: "owner",
      permission: "branches.read",
    },
    component: () => import("@/pages/panels/owner/branches/view.vue"),
  },
  {
    path: "/roles",
    name: "owner.roles",
    meta: {
      title: setTitle("Perfis"),
      authRequired: true,
      permission: ["roles.index", "roles.read"],
    },
    component: () => import("@/pages/panels/owner/roles/index.vue"),
  },
  {
    path: "/roles/:id",
    name: "owner.roles.form",
    meta: {
      title: setTitle("Perfil"),
      authRequired: true,
      permission: ["roles.read", "roles.update", "roles.create"],
    },
    component: () => import("@/pages/panels/owner/roles/form.vue"),
  },
  {
    path: "/audits",
    name: "owner.audits",
    meta: {
      title: setTitle("Auditoria"),
      authRequired: true,
      panel: "owner",
    },
    component: () => import("@/views/panels/owner/audits/index.vue"),
  },
  {
    path: "/audits/:id",
    name: "owner.audits.show",
    meta: {
      title: setTitle("Detalhe da auditoria"),
      authRequired: true,
      panel: "owner",
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
    path: "/company/branches",
    name: "company.branches",
    meta: {
      title: setTitle("Filiais da empresa"),
      authRequired: true,
      permission: ["branches.index", "branches.read"],
    },
    component: () => import("@/pages/panels/owner/branches/index.vue"),
  },
  {
    path: "/company/my-company",
    name: "company.my-company.view",
    meta: {
      title: setTitle("Minha empresa"),
      authRequired: true,
    },
    component: () => import("@/views/panels/owner/companies/View.vue"),
  },
  {
    path: "/company/my-company/edit",
    name: "company.my-company.edit",
    meta: {
      title: setTitle("Minha empresa"),
      authRequired: true,
    },
    component: () => import("@/views/panels/company/companies/EditMyCompany.vue"),
  },
  {
    path: "/company/branches/create",
    name: "company.branches.create",
    meta: {
      title: setTitle("Nova filial"),
      authRequired: true,
      permission: "branches.create",
    },
    component: () => import("@/pages/panels/owner/branches/create.vue"),
  },
  {
    path: "/company/branches/:id/edit",
    name: "company.branches.edit",
    meta: {
      title: setTitle("Editar filial"),
      authRequired: true,
      permission: "branches.update",
    },
    component: () => import("@/pages/panels/owner/branches/edit.vue"),
  },
  {
    path: "/company/branches/:id",
    name: "company.branches.view",
    meta: {
      title: setTitle("Visualizar filial"),
      authRequired: true,
      permission: "branches.read",
    },
    component: () => import("@/pages/panels/owner/branches/view.vue"),
  },
  {
    path: "/branch",
    name: "panels.branch.dashboard",
    meta: {
      title: setTitle("Dashboard Filial"),
      authRequired: true,
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/views/panels/branch/dashboard/index.vue"),
  },
  {
    path: "/branch/my-branch",
    name: "branch.my-branch.view",
    meta: {
      title: setTitle("Minha filial"),
      authRequired: true,
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/views/panels/owner/branches/View.vue"),
  },
  {
    path: "/branch/my-branch/edit",
    name: "branch.my-branch.edit",
    meta: {
      title: setTitle("Minha filial"),
      authRequired: true,
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/views/panels/branch/branches/EditMyBranch.vue"),
  },
  {
    path: "/employee/my-profile",
    name: "employee.my-profile.view",
    meta: {
      title: setTitle("Meu perfil"),
      authRequired: true,
      role: ["user", "employee", "colaborador"],
      rolePrefix: ["colaborador-b"],
    },
    component: () => import("@/views/panels/employee/profile/View.vue"),
  },
  {
    path: "/employee/my-profile/edit",
    name: "employee.my-profile.edit",
    meta: {
      title: setTitle("Editar meu perfil"),
      authRequired: true,
      role: ["user", "employee", "colaborador"],
      rolePrefix: ["colaborador-b"],
    },
    component: () => import("@/views/panels/employee/profile/Edit.vue"),
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
