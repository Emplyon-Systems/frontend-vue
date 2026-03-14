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
    path: "/auth/error-403",
    name: "error.403",
    meta: {
      title: setTitle("Sem permissão"),
      authRequired: true,
    },
    component: () => import("@/views/auth/error-403.vue"),
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
    path: "/sectors",
    name: "owner.sectors",
    meta: {
      title: setTitle("Setores"),
      authRequired: true,
      panel: "owner",
      permission: ["sectors.index", "sectors.read"],
    },
    component: () => import("@/pages/panels/owner/sectors/index.vue"),
  },
  {
    path: "/sectors/create",
    name: "owner.sectors.create",
    meta: {
      title: setTitle("Novo setor"),
      authRequired: true,
      panel: "owner",
      permission: "sectors.create",
    },
    component: () => import("@/pages/panels/owner/sectors/create.vue"),
  },
  {
    path: "/sectors/:id/edit",
    name: "owner.sectors.edit",
    meta: {
      title: setTitle("Editar setor"),
      authRequired: true,
      panel: "owner",
      permission: "sectors.update",
    },
    component: () => import("@/pages/panels/owner/sectors/edit.vue"),
  },
  {
    path: "/sectors/:id",
    name: "owner.sectors.view",
    meta: {
      title: setTitle("Visualizar setor"),
      authRequired: true,
      panel: "owner",
      permission: "sectors.read",
    },
    component: () => import("@/pages/panels/owner/sectors/view.vue"),
  },
  {
    path: "/shifts",
    name: "owner.shifts",
    meta: {
      title: setTitle("Turnos"),
      authRequired: true,
      panel: "owner",
      permission: ["shifts.index", "shifts.read"],
    },
    component: () => import("@/pages/panels/owner/shifts/index.vue"),
  },
  {
    path: "/shifts/create",
    name: "owner.shifts.create",
    meta: {
      title: setTitle("Novo turno"),
      authRequired: true,
      panel: "owner",
      permission: "shifts.create",
    },
    component: () => import("@/pages/panels/owner/shifts/create.vue"),
  },
  {
    path: "/shifts/:id/edit",
    name: "owner.shifts.edit",
    meta: {
      title: setTitle("Editar turno"),
      authRequired: true,
      panel: "owner",
      permission: "shifts.update",
    },
    component: () => import("@/pages/panels/owner/shifts/edit.vue"),
  },
  {
    path: "/shifts/:id",
    name: "owner.shifts.view",
    meta: {
      title: setTitle("Visualizar turno"),
      authRequired: true,
      panel: "owner",
      permission: "shifts.read",
    },
    component: () => import("@/pages/panels/owner/shifts/view.vue"),
  },
  {
    path: "/modality-types",
    name: "owner.modality-types",
    meta: {
      title: setTitle("Modalidades"),
      authRequired: true,
      panel: "owner",
      permission: ["modality_types.index", "modality_types.read"],
    },
    component: () => import("@/pages/panels/owner/modality-types/index.vue"),
  },
  {
    path: "/modality-types/create",
    name: "owner.modality-types.create",
    meta: {
      title: setTitle("Nova modalidade"),
      authRequired: true,
      panel: "owner",
      permission: "modality_types.create",
    },
    component: () => import("@/pages/panels/owner/modality-types/create.vue"),
  },
  {
    path: "/modality-types/:id/edit",
    name: "owner.modality-types.edit",
    meta: {
      title: setTitle("Editar modalidade"),
      authRequired: true,
      panel: "owner",
      permission: "modality_types.update",
    },
    component: () => import("@/pages/panels/owner/modality-types/edit.vue"),
  },
  {
    path: "/modality-types/:id",
    name: "owner.modality-types.view",
    meta: {
      title: setTitle("Visualizar modalidade"),
      authRequired: true,
      panel: "owner",
      permission: "modality_types.read",
    },
    component: () => import("@/pages/panels/owner/modality-types/view.vue"),
  },
  {
    path: "/scale-types",
    name: "owner.scale-types",
    meta: {
      title: setTitle("Tipos de escala"),
      authRequired: true,
      panel: "owner",
      permission: ["scale_types.index", "scale_types.read"],
    },
    component: () => import("@/pages/panels/owner/scale-types/index.vue"),
  },
  {
    path: "/scale-types/create",
    name: "owner.scale-types.create",
    meta: {
      title: setTitle("Novo tipo de escala"),
      authRequired: true,
      panel: "owner",
      permission: "scale_types.create",
    },
    component: () => import("@/pages/panels/owner/scale-types/create.vue"),
  },
  {
    path: "/scale-types/:id/edit",
    name: "owner.scale-types.edit",
    meta: {
      title: setTitle("Editar tipo de escala"),
      authRequired: true,
      panel: "owner",
      permission: "scale_types.update",
    },
    component: () => import("@/pages/panels/owner/scale-types/edit.vue"),
  },
  {
    path: "/scale-types/:id",
    name: "owner.scale-types.view",
    meta: {
      title: setTitle("Visualizar tipo de escala"),
      authRequired: true,
      panel: "owner",
      permission: "scale_types.read",
    },
    component: () => import("@/pages/panels/owner/scale-types/view.vue"),
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
    path: "/my-profile",
    name: "owner.my-profile.view",
    meta: {
      title: setTitle("Meu perfil"),
      authRequired: true,
    },
    component: () => import("@/views/panels/employee/profile/View.vue"),
  },
  {
    path: "/my-profile/edit",
    name: "owner.my-profile.edit",
    meta: {
      title: setTitle("Editar meu perfil"),
      authRequired: true,
    },
    component: () => import("@/views/panels/employee/profile/Edit.vue"),
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
    path: "/company/my-profile",
    name: "company.my-profile.view",
    meta: {
      title: setTitle("Meu perfil"),
      authRequired: true,
    },
    component: () => import("@/views/panels/employee/profile/View.vue"),
  },
  {
    path: "/company/my-profile/edit",
    name: "company.my-profile.edit",
    meta: {
      title: setTitle("Editar meu perfil"),
      authRequired: true,
    },
    component: () => import("@/views/panels/employee/profile/Edit.vue"),
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
    path: "/company/sectors",
    name: "company.sectors",
    meta: {
      title: setTitle("Setores da empresa"),
      authRequired: true,
      permission: ["sectors.index", "sectors.read"],
    },
    component: () => import("@/pages/panels/owner/sectors/index.vue"),
  },
  {
    path: "/company/sectors/create",
    name: "company.sectors.create",
    meta: {
      title: setTitle("Novo setor"),
      authRequired: true,
      permission: "sectors.create",
    },
    component: () => import("@/pages/panels/owner/sectors/create.vue"),
  },
  {
    path: "/company/sectors/:id/edit",
    name: "company.sectors.edit",
    meta: {
      title: setTitle("Editar setor"),
      authRequired: true,
      permission: "sectors.update",
    },
    component: () => import("@/pages/panels/owner/sectors/edit.vue"),
  },
  {
    path: "/company/sectors/:id",
    name: "company.sectors.view",
    meta: {
      title: setTitle("Visualizar setor"),
      authRequired: true,
      permission: "sectors.read",
    },
    component: () => import("@/pages/panels/owner/sectors/view.vue"),
  },
  {
    path: "/company/shifts",
    name: "company.shifts",
    meta: {
      title: setTitle("Turnos da empresa"),
      authRequired: true,
      permission: ["shifts.index", "shifts.read"],
    },
    component: () => import("@/pages/panels/owner/shifts/index.vue"),
  },
  {
    path: "/company/shifts/create",
    name: "company.shifts.create",
    meta: {
      title: setTitle("Novo turno"),
      authRequired: true,
      permission: "shifts.create",
    },
    component: () => import("@/pages/panels/owner/shifts/create.vue"),
  },
  {
    path: "/company/shifts/:id/edit",
    name: "company.shifts.edit",
    meta: {
      title: setTitle("Editar turno"),
      authRequired: true,
      permission: "shifts.update",
    },
    component: () => import("@/pages/panels/owner/shifts/edit.vue"),
  },
  {
    path: "/company/shifts/:id",
    name: "company.shifts.view",
    meta: {
      title: setTitle("Visualizar turno"),
      authRequired: true,
      permission: "shifts.read",
    },
    component: () => import("@/pages/panels/owner/shifts/view.vue"),
  },
  {
    path: "/company/modality-types",
    name: "company.modality-types",
    meta: {
      title: setTitle("Modalidades da empresa"),
      authRequired: true,
      permission: ["modality_types.index", "modality_types.read"],
    },
    component: () => import("@/pages/panels/owner/modality-types/index.vue"),
  },
  {
    path: "/company/modality-types/create",
    name: "company.modality-types.create",
    meta: {
      title: setTitle("Nova modalidade"),
      authRequired: true,
      permission: "modality_types.create",
    },
    component: () => import("@/pages/panels/owner/modality-types/create.vue"),
  },
  {
    path: "/company/modality-types/:id/edit",
    name: "company.modality-types.edit",
    meta: {
      title: setTitle("Editar modalidade"),
      authRequired: true,
      permission: "modality_types.update",
    },
    component: () => import("@/pages/panels/owner/modality-types/edit.vue"),
  },
  {
    path: "/company/modality-types/:id",
    name: "company.modality-types.view",
    meta: {
      title: setTitle("Visualizar modalidade"),
      authRequired: true,
      permission: "modality_types.read",
    },
    component: () => import("@/pages/panels/owner/modality-types/view.vue"),
  },
  {
    path: "/company/scale-types",
    name: "company.scale-types",
    meta: {
      title: setTitle("Tipos de escala da empresa"),
      authRequired: true,
      permission: ["scale_types.index", "scale_types.read"],
    },
    component: () => import("@/pages/panels/owner/scale-types/index.vue"),
  },
  {
    path: "/company/scale-types/create",
    name: "company.scale-types.create",
    meta: {
      title: setTitle("Novo tipo de escala"),
      authRequired: true,
      permission: "scale_types.create",
    },
    component: () => import("@/pages/panels/owner/scale-types/create.vue"),
  },
  {
    path: "/company/scale-types/:id/edit",
    name: "company.scale-types.edit",
    meta: {
      title: setTitle("Editar tipo de escala"),
      authRequired: true,
      permission: "scale_types.update",
    },
    component: () => import("@/pages/panels/owner/scale-types/edit.vue"),
  },
  {
    path: "/company/scale-types/:id",
    name: "company.scale-types.view",
    meta: {
      title: setTitle("Visualizar tipo de escala"),
      authRequired: true,
      permission: "scale_types.read",
    },
    component: () => import("@/pages/panels/owner/scale-types/view.vue"),
  },
  {
    path: "/branch/my-profile",
    name: "branch.my-profile.view",
    meta: {
      title: setTitle("Meu perfil"),
      authRequired: true,
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/views/panels/employee/profile/View.vue"),
  },
  {
    path: "/branch/my-profile/edit",
    name: "branch.my-profile.edit",
    meta: {
      title: setTitle("Editar meu perfil"),
      authRequired: true,
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/views/panels/employee/profile/Edit.vue"),
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
    path: "/branch/sectors",
    name: "branch.sectors",
    meta: {
      title: setTitle("Setores da filial"),
      authRequired: true,
      permission: ["sectors.index", "sectors.read"],
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/pages/panels/owner/sectors/index.vue"),
  },
  {
    path: "/branch/sectors/create",
    name: "branch.sectors.create",
    meta: {
      title: setTitle("Novo setor"),
      authRequired: true,
      permission: "sectors.create",
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/pages/panels/owner/sectors/create.vue"),
  },
  {
    path: "/branch/sectors/:id/edit",
    name: "branch.sectors.edit",
    meta: {
      title: setTitle("Editar setor"),
      authRequired: true,
      permission: "sectors.update",
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/pages/panels/owner/sectors/edit.vue"),
  },
  {
    path: "/branch/sectors/:id",
    name: "branch.sectors.view",
    meta: {
      title: setTitle("Visualizar setor"),
      authRequired: true,
      permission: "sectors.read",
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/pages/panels/owner/sectors/view.vue"),
  },
  {
    path: "/branch/shifts",
    name: "branch.shifts",
    meta: {
      title: setTitle("Turnos da filial"),
      authRequired: true,
      permission: ["shifts.index", "shifts.read"],
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/pages/panels/owner/shifts/index.vue"),
  },
  {
    path: "/branch/shifts/create",
    name: "branch.shifts.create",
    meta: {
      title: setTitle("Novo turno"),
      authRequired: true,
      permission: "shifts.create",
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/pages/panels/owner/shifts/create.vue"),
  },
  {
    path: "/branch/shifts/:id/edit",
    name: "branch.shifts.edit",
    meta: {
      title: setTitle("Editar turno"),
      authRequired: true,
      permission: "shifts.update",
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/pages/panels/owner/shifts/edit.vue"),
  },
  {
    path: "/branch/shifts/:id",
    name: "branch.shifts.view",
    meta: {
      title: setTitle("Visualizar turno"),
      authRequired: true,
      permission: "shifts.read",
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/pages/panels/owner/shifts/view.vue"),
  },
  {
    path: "/branch/modality-types",
    name: "branch.modality-types",
    meta: {
      title: setTitle("Modalidades da filial"),
      authRequired: true,
      permission: ["modality_types.index", "modality_types.read"],
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/pages/panels/owner/modality-types/index.vue"),
  },
  {
    path: "/branch/modality-types/create",
    name: "branch.modality-types.create",
    meta: {
      title: setTitle("Nova modalidade"),
      authRequired: true,
      permission: "modality_types.create",
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/pages/panels/owner/modality-types/create.vue"),
  },
  {
    path: "/branch/modality-types/:id/edit",
    name: "branch.modality-types.edit",
    meta: {
      title: setTitle("Editar modalidade"),
      authRequired: true,
      permission: "modality_types.update",
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/pages/panels/owner/modality-types/edit.vue"),
  },
  {
    path: "/branch/modality-types/:id",
    name: "branch.modality-types.view",
    meta: {
      title: setTitle("Visualizar modalidade"),
      authRequired: true,
      permission: "modality_types.read",
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/pages/panels/owner/modality-types/view.vue"),
  },
  {
    path: "/branch/scale-types",
    name: "branch.scale-types",
    meta: {
      title: setTitle("Tipos de escala da filial"),
      authRequired: true,
      permission: ["scale_types.index", "scale_types.read"],
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/pages/panels/owner/scale-types/index.vue"),
  },
  {
    path: "/branch/scale-types/create",
    name: "branch.scale-types.create",
    meta: {
      title: setTitle("Novo tipo de escala"),
      authRequired: true,
      permission: "scale_types.create",
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/pages/panels/owner/scale-types/create.vue"),
  },
  {
    path: "/branch/scale-types/:id/edit",
    name: "branch.scale-types.edit",
    meta: {
      title: setTitle("Editar tipo de escala"),
      authRequired: true,
      permission: "scale_types.update",
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/pages/panels/owner/scale-types/edit.vue"),
  },
  {
    path: "/branch/scale-types/:id",
    name: "branch.scale-types.view",
    meta: {
      title: setTitle("Visualizar tipo de escala"),
      authRequired: true,
      permission: "scale_types.read",
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/pages/panels/owner/scale-types/view.vue"),
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
