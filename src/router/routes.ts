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

/** URLs antigas /documentation → versão no painel (autenticada) */
const documentationLegacyRedirects = [
  { path: "/documentation", redirect: "/documentation-v1" },
  {
    path: "/documentation/:pathMatch(.*)*",
    redirect: (to: { params: { pathMatch?: string | string[] } }) => {
      const raw = to.params.pathMatch;
      const suffix = Array.isArray(raw) ? raw.filter(Boolean).join("/") : raw ? String(raw) : "";
      return suffix ? `/documentation-v1/${suffix}` : "/documentation-v1";
    },
  },
];

/** Documentação v1 — sessão obrigatória; painel owner (superadmin) */
const documentationRoutes = {
  path: "/documentation-v1",
  meta: {
    authRequired: true,
    panel: "owner",
  },
  component: () => import("@/views/documentation/DocumentationPanelShell.vue"),
  children: [
    {
      path: "",
      component: () => import("@/views/documentation/DocumentationLayoutPanel.vue"),
      children: [
    {
      path: "",
      name: "documentation.home",
      meta: { title: setTitle("Documentação") },
      component: () => import("@/views/documentation/pages/DocIntro.vue"),
    },
    {
      path: "fonte-markdown",
      name: "documentation.markdown",
      meta: { title: setTitle("Documentação — Markdown") },
      component: () => import("@/views/documentation/pages/DocMarkdown.vue"),
    },
    {
      path: "backend",
      name: "documentation.backend.index",
      meta: { title: setTitle("Documentação — Backend") },
      component: () => import("@/views/documentation/pages/backend/DocBackendIndex.vue"),
    },
    {
      path: "backend/architecture",
      name: "documentation.backend.architecture",
      meta: { title: setTitle("Backend — Arquitetura") },
      component: () => import("@/views/documentation/pages/backend/DocBackendArchitecture.vue"),
    },
    {
      path: "backend/modulo-completo",
      name: "documentation.backend.moduloCompleto",
      meta: { title: setTitle("Backend — Módulo completo") },
      component: () => import("@/views/documentation/pages/backend/DocBackendModuloCompleto.vue"),
    },
    {
      path: "backend/controllers/visao",
      name: "documentation.backend.controllers.visao",
      meta: { title: setTitle("Backend — Controllers visão") },
      component: () =>
        import("@/views/documentation/pages/backend/DocBackendControllersVisao.vue"),
    },
    {
      path: "backend/controllers/padrao",
      name: "documentation.backend.controllers.padrao",
      meta: { title: setTitle("Backend — Controllers padrão") },
      component: () =>
        import("@/views/documentation/pages/backend/padroes/DocBackendPadraoController.vue"),
    },
    {
      path: "backend/controllers/regras",
      name: "documentation.backend.controllers.regras",
      meta: { title: setTitle("Backend — Controllers regras") },
      component: () =>
        import("@/views/documentation/pages/backend/DocBackendControllersRegras.vue"),
    },
    {
      path: "backend/services/visao",
      name: "documentation.backend.services.visao",
      meta: { title: setTitle("Backend — Services visão") },
      component: () => import("@/views/documentation/pages/backend/DocBackendServicesVisao.vue"),
    },
    {
      path: "backend/services/padrao",
      name: "documentation.backend.services.padrao",
      meta: { title: setTitle("Backend — Services padrão") },
      component: () =>
        import("@/views/documentation/pages/backend/padroes/DocBackendPadraoService.vue"),
    },
    {
      path: "backend/services/regras",
      name: "documentation.backend.services.regras",
      meta: { title: setTitle("Backend — Services regras") },
      component: () => import("@/views/documentation/pages/backend/DocBackendServicesRegras.vue"),
    },
    {
      path: "backend/repositories/visao",
      name: "documentation.backend.repositories.visao",
      meta: { title: setTitle("Backend — Repositories visão") },
      component: () =>
        import("@/views/documentation/pages/backend/DocBackendRepositoriesVisao.vue"),
    },
    {
      path: "backend/repositories/padrao",
      name: "documentation.backend.repositories.padrao",
      meta: { title: setTitle("Backend — Repositories padrão") },
      component: () =>
        import("@/views/documentation/pages/backend/padroes/DocBackendPadraoRepository.vue"),
    },
    {
      path: "backend/repositories/regras",
      name: "documentation.backend.repositories.regras",
      meta: { title: setTitle("Backend — Repositories regras") },
      component: () =>
        import("@/views/documentation/pages/backend/DocBackendRepositoriesRegras.vue"),
    },
    {
      path: "backend/form-requests/visao",
      name: "documentation.backend.formRequests.visao",
      meta: { title: setTitle("Backend — Form Requests visão") },
      component: () =>
        import("@/views/documentation/pages/backend/DocBackendFormRequestsVisao.vue"),
    },
    {
      path: "backend/form-requests/padrao",
      name: "documentation.backend.formRequests.padrao",
      meta: { title: setTitle("Backend — Form Requests padrão") },
      component: () =>
        import("@/views/documentation/pages/backend/padroes/DocBackendPadraoRequest.vue"),
    },
    {
      path: "backend/form-requests/regras",
      name: "documentation.backend.formRequests.regras",
      meta: { title: setTitle("Backend — Form Requests regras") },
      component: () =>
        import("@/views/documentation/pages/backend/DocBackendFormRequestsRegras.vue"),
    },
    {
      path: "backend/policies/visao",
      name: "documentation.backend.policies.visao",
      meta: { title: setTitle("Backend — Policies visão") },
      component: () => import("@/views/documentation/pages/backend/DocBackendPoliciesVisao.vue"),
    },
    {
      path: "backend/policies/padrao",
      name: "documentation.backend.policies.padrao",
      meta: { title: setTitle("Backend — Policies padrão") },
      component: () =>
        import("@/views/documentation/pages/backend/padroes/DocBackendPadraoPolicy.vue"),
    },
    {
      path: "backend/policies/regras",
      name: "documentation.backend.policies.regras",
      meta: { title: setTitle("Backend — Policies regras") },
      component: () => import("@/views/documentation/pages/backend/DocBackendPoliciesRegras.vue"),
    },
    {
      path: "backend/observers/visao",
      name: "documentation.backend.observers.visao",
      meta: { title: setTitle("Backend — Observers visão") },
      component: () => import("@/views/documentation/pages/backend/DocBackendObserversVisao.vue"),
    },
    {
      path: "backend/observers/padrao",
      name: "documentation.backend.observers.padrao",
      meta: { title: setTitle("Backend — Observers padrão") },
      component: () =>
        import("@/views/documentation/pages/backend/padroes/DocBackendPadraoObserver.vue"),
    },
    {
      path: "backend/observers/regras",
      name: "documentation.backend.observers.regras",
      meta: { title: setTitle("Backend — Observers regras") },
      component: () => import("@/views/documentation/pages/backend/DocBackendObserversRegras.vue"),
    },
    {
      path: "backend/camadas",
      name: "documentation.backend.camadas",
      meta: { title: setTitle("Backend — Camadas") },
      component: () => import("@/views/documentation/pages/backend/DocBackendCamadas.vue"),
    },
    {
      path: "backend/autorizacao",
      name: "documentation.backend.autorizacao",
      meta: { title: setTitle("Backend — Autorização") },
      component: () => import("@/views/documentation/pages/backend/DocBackendAutorizacao.vue"),
    },
    {
      path: "backend/migrations",
      name: "documentation.backend.migrations",
      meta: { title: setTitle("Backend — Migrations") },
      component: () => import("@/views/documentation/pages/backend/DocBackendMigrations.vue"),
    },
    {
      path: "backend/modelo-dados",
      name: "documentation.backend.modelo-dados",
      meta: { title: setTitle("Backend — Modelo de dados") },
      component: () => import("@/views/documentation/pages/backend/DocBackendModeloDados.vue"),
    },
    {
      path: "backend/exemplo-users",
      name: "documentation.backend.exemplo-users",
      meta: { title: setTitle("Backend — Users") },
      component: () => import("@/views/documentation/pages/backend/DocBackendExemploUsers.vue"),
    },
    {
      path: "backend/api",
      name: "documentation.backend.api",
      meta: { title: setTitle("Backend — API") },
      component: () => import("@/views/documentation/pages/backend/DocBackendApi.vue"),
    },
    {
      path: "backend/testes",
      name: "documentation.backend.testes",
      meta: { title: setTitle("Backend — Testes") },
      component: () => import("@/views/documentation/pages/backend/DocBackendTestes.vue"),
    },
    {
      path: "backend/padroes",
      redirect: { name: "documentation.backend.architecture" },
    },
    {
      path: "backend/padrao-controller",
      redirect: { name: "documentation.backend.controllers.padrao" },
    },
    {
      path: "backend/padrao-service",
      redirect: { name: "documentation.backend.services.padrao" },
    },
    {
      path: "backend/padrao-repository",
      redirect: { name: "documentation.backend.repositories.padrao" },
    },
    {
      path: "backend/padrao-request",
      redirect: { name: "documentation.backend.formRequests.padrao" },
    },
    {
      path: "backend/padrao-policy",
      redirect: { name: "documentation.backend.policies.padrao" },
    },
    {
      path: "backend/padrao-observer",
      redirect: { name: "documentation.backend.observers.padrao" },
    },
    {
      path: "backend/repositorios",
      redirect: { name: "documentation.backend.repositories.visao" },
    },
    {
      path: "frontend",
      name: "documentation.frontend.index",
      meta: { title: setTitle("Documentação — Frontend") },
      component: () => import("@/views/documentation/pages/frontend/DocFrontendIndex.vue"),
    },
    {
      path: "frontend/architecture",
      name: "documentation.frontend.architecture",
      meta: { title: setTitle("Frontend — Arquitetura") },
      component: () => import("@/views/documentation/pages/frontend/DocFrontendArchitecture.vue"),
    },
    {
      path: "frontend/modulo-completo",
      name: "documentation.frontend.moduloCompleto",
      meta: { title: setTitle("Frontend — Módulo completo") },
      component: () => import("@/views/documentation/pages/frontend/DocFrontendModuloCompleto.vue"),
    },
    {
      path: "frontend/pages/visao",
      name: "documentation.frontend.pages.visao",
      meta: { title: setTitle("Frontend — Pages visão") },
      component: () => import("@/views/documentation/pages/frontend/DocFrontendPagesVisao.vue"),
    },
    {
      path: "frontend/pages/padrao",
      name: "documentation.frontend.pages.padrao",
      meta: { title: setTitle("Frontend — Pages padrão") },
      component: () =>
        import("@/views/documentation/pages/frontend/padroes/DocFrontendPadraoPage.vue"),
    },
    {
      path: "frontend/pages/regras",
      name: "documentation.frontend.pages.regras",
      meta: { title: setTitle("Frontend — Pages regras") },
      component: () => import("@/views/documentation/pages/frontend/DocFrontendPagesRegras.vue"),
    },
    {
      path: "frontend/views/visao",
      name: "documentation.frontend.views.visao",
      meta: { title: setTitle("Frontend — Views visão") },
      component: () => import("@/views/documentation/pages/frontend/DocFrontendViewsVisao.vue"),
    },
    {
      path: "frontend/views/padrao",
      name: "documentation.frontend.views.padrao",
      meta: { title: setTitle("Frontend — Views padrão") },
      component: () =>
        import("@/views/documentation/pages/frontend/padroes/DocFrontendPadraoView.vue"),
    },
    {
      path: "frontend/views/regras",
      name: "documentation.frontend.views.regras",
      meta: { title: setTitle("Frontend — Views regras") },
      component: () => import("@/views/documentation/pages/frontend/DocFrontendViewsRegras.vue"),
    },
    {
      path: "frontend/router/visao",
      name: "documentation.frontend.router.visao",
      meta: { title: setTitle("Frontend — Rotas visão") },
      component: () => import("@/views/documentation/pages/frontend/DocFrontendRouterVisao.vue"),
    },
    {
      path: "frontend/router/padrao",
      name: "documentation.frontend.router.padrao",
      meta: { title: setTitle("Frontend — Rotas padrão") },
      component: () =>
        import("@/views/documentation/pages/frontend/padroes/DocFrontendPadraoRota.vue"),
    },
    {
      path: "frontend/router/regras",
      name: "documentation.frontend.router.regras",
      meta: { title: setTitle("Frontend — Rotas regras") },
      component: () => import("@/views/documentation/pages/frontend/DocFrontendRouterRegras.vue"),
    },
    {
      path: "frontend/api/visao",
      name: "documentation.frontend.api.visao",
      meta: { title: setTitle("Frontend — API cliente visão") },
      component: () => import("@/views/documentation/pages/frontend/DocFrontendApiVisao.vue"),
    },
    {
      path: "frontend/api/padrao",
      name: "documentation.frontend.api.padrao",
      meta: { title: setTitle("Frontend — API cliente padrão") },
      component: () =>
        import("@/views/documentation/pages/frontend/padroes/DocFrontendPadraoApi.vue"),
    },
    {
      path: "frontend/api/regras",
      name: "documentation.frontend.api.regras",
      meta: { title: setTitle("Frontend — API cliente regras") },
      component: () => import("@/views/documentation/pages/frontend/DocFrontendApiRegras.vue"),
    },
    {
      path: "frontend/estrutura",
      name: "documentation.frontend.estrutura",
      meta: { title: setTitle("Frontend — Estrutura") },
      component: () => import("@/views/documentation/pages/frontend/DocFrontendEstrutura.vue"),
    },
    {
      path: "frontend/rotas-auth",
      name: "documentation.frontend.rotas-auth",
      meta: { title: setTitle("Frontend — Guards e auth") },
      component: () => import("@/views/documentation/pages/frontend/DocFrontendRotasAuth.vue"),
    },
    {
      path: "frontend/padroes",
      redirect: { name: "documentation.frontend.architecture" },
    },
    {
      path: "frontend/padrao-page",
      redirect: { name: "documentation.frontend.pages.padrao" },
    },
    {
      path: "frontend/padrao-view",
      redirect: { name: "documentation.frontend.views.padrao" },
    },
    {
      path: "frontend/padrao-rota",
      redirect: { name: "documentation.frontend.router.padrao" },
    },
    {
      path: "frontend/padrao-api",
      redirect: { name: "documentation.frontend.api.padrao" },
    },
      ],
    },
  ],
};

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
      /** Empresa/filial: perfis tenant por slug (sem `filial-b` — evita colaborador-b* via hasBranchScopedRole). */
      role: ["branch_manager", "branch", "filial", "admin", "empresa"],
      rolePrefix: ["gerente-filial", "gerente-c", "empresa-c"],
    },
    component: () => import("@/pages/panels/owner/users/index.vue"),
  },
  {
    path: "/users/create",
    name: "owner.users.create",
    meta: {
      title: setTitle("Novo usuário"),
      authRequired: true,
      permission: "users.create",
      role: ["branch_manager", "branch", "filial", "admin", "empresa"],
      rolePrefix: ["gerente-filial", "gerente-c", "empresa-c"],
    },
    component: () => import("@/pages/panels/owner/users/create.vue"),
  },
  {
    path: "/users/:id/edit",
    name: "owner.users.edit",
    meta: {
      title: setTitle("Editar usuário"),
      authRequired: true,
      permission: "users.update",
      role: ["branch_manager", "branch", "filial", "admin", "empresa"],
      rolePrefix: ["gerente-filial", "gerente-c", "empresa-c"],
    },
    component: () => import("@/pages/panels/owner/users/edit.vue"),
  },
  {
    path: "/users/:id",
    name: "owner.users.view",
    meta: {
      title: setTitle("Visualizar usuário"),
      authRequired: true,
      permission: "users.read",
      role: ["branch_manager", "branch", "filial", "admin", "empresa"],
      rolePrefix: ["gerente-filial", "gerente-c", "empresa-c"],
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
    name: "owner.company.workspace",
    meta: {
      title: setTitle("Empresa"),
      authRequired: true,
      panel: "owner",
      permission: "companies.read",
    },
    component: () => import("@/layouts/CompanyWorkspaceLayout.vue"),
    redirect: (to) => ({ name: "owner.company.workspace.overview", params: to.params }),
    children: [
      {
        path: "overview",
        name: "owner.company.workspace.overview",
        meta: { title: setTitle("Empresa — Resumo"), authRequired: true, panel: "owner", permission: "companies.read" },
        component: () => import("@/pages/panels/owner/companies/workspace/overview.vue"),
      },
      {
        path: "branches",
        name: "owner.company.workspace.branches",
        meta: { title: setTitle("Empresa — Filiais"), authRequired: true, panel: "owner", permission: ["branches.index", "branches.read"] },
        component: () => import("@/pages/panels/owner/companies/workspace/branches.vue"),
      },
      {
        path: "sectors",
        name: "owner.company.workspace.sectors",
        meta: { title: setTitle("Empresa — Setores"), authRequired: true, panel: "owner", permission: ["sectors.index", "sectors.read"] },
        component: () => import("@/pages/panels/owner/companies/workspace/sectors.vue"),
      },
      {
        path: "employees",
        name: "owner.company.workspace.employees",
        meta: { title: setTitle("Empresa — Funcionários"), authRequired: true, panel: "owner", permission: ["employees.index", "employees.read"] },
        component: () => import("@/pages/panels/owner/companies/workspace/employees.vue"),
      },
      {
        path: "shifts",
        name: "owner.company.workspace.shifts",
        meta: { title: setTitle("Empresa — Turnos"), authRequired: true, panel: "owner", permission: ["shifts.index", "shifts.read"] },
        component: () => import("@/pages/panels/owner/companies/workspace/shifts.vue"),
      },
      {
        path: "modality-types",
        name: "owner.company.workspace.modality-types",
        meta: { title: setTitle("Empresa — Modalidades"), authRequired: true, panel: "owner", permission: ["modality_types.index", "modality_types.read"] },
        component: () => import("@/pages/panels/owner/companies/workspace/modality-types.vue"),
      },
      {
        path: "scale-types",
        name: "owner.company.workspace.scale-types",
        meta: { title: setTitle("Empresa — Tipos de escala"), authRequired: true, panel: "owner", permission: ["scale_types.index", "scale_types.read"] },
        component: () => import("@/pages/panels/owner/companies/workspace/scale-types.vue"),
      },
      {
        path: "users",
        name: "owner.company.workspace.users",
        meta: { title: setTitle("Empresa — Usuarios"), authRequired: true, panel: "owner", permission: ["users.index", "users.read"] },
        component: () => import("@/pages/panels/owner/companies/workspace/users.vue"),
      },
    ],
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
    path: "/employees",
    name: "owner.employees",
    meta: {
      title: setTitle("Funcionários"),
      authRequired: true,
      panel: "owner",
      permission: ["employees.index", "employees.read"],
    },
    component: () => import("@/pages/panels/owner/employees/index.vue"),
  },
  {
    path: "/employees/create",
    name: "owner.employees.create",
    meta: {
      title: setTitle("Novo funcionário"),
      authRequired: true,
      panel: "owner",
      permission: "employees.create",
    },
    component: () => import("@/pages/panels/owner/employees/create.vue"),
  },
  {
    path: "/employees/:id/edit",
    name: "owner.employees.edit",
    meta: {
      title: setTitle("Editar funcionário"),
      authRequired: true,
      panel: "owner",
      permission: "employees.update",
    },
    component: () => import("@/pages/panels/owner/employees/edit.vue"),
  },
  {
    path: "/employees/:id",
    name: "owner.employees.view",
    meta: {
      title: setTitle("Visualizar funcionário"),
      authRequired: true,
      panel: "owner",
      permission: "employees.read",
    },
    component: () => import("@/pages/panels/owner/employees/view.vue"),
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
  /** Redirects de rotas planas antigas → listagem de empresas (hub empresa) */
  { path: "/branches", redirect: "/companies" },
  { path: "/sectors", redirect: "/companies" },
  { path: "/employees", redirect: "/companies" },
  { path: "/shifts", redirect: "/companies" },
  { path: "/modality-types", redirect: "/companies" },
  { path: "/scale-types", redirect: "/companies" },
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
    path: "/role-templates",
    name: "owner.role-templates",
    meta: {
      title: setTitle("Templates de perfil (empresas e filiais)"),
      authRequired: true,
      permission: [
        "role_templates.index",
        "role_templates.read",
        "role_templates.update",
        "role_templates.create",
        "role_templates.delete",
      ],
    },
    component: () => import("@/pages/panels/owner/role-templates/index.vue"),
  },
  {
    path: "/role-templates/create",
    name: "owner.role-templates.create",
    meta: {
      title: setTitle("Novo template de perfil"),
      authRequired: true,
      permission: ["role_templates.create"],
    },
    component: () => import("@/pages/panels/owner/role-templates/create.vue"),
  },
  {
    path: "/role-templates/:id/edit",
    name: "owner.role-templates.edit",
    meta: {
      title: setTitle("Editar template de perfil"),
      authRequired: true,
      permission: ["role_templates.index", "role_templates.read", "role_templates.update"],
    },
    component: () => import("@/pages/panels/owner/role-templates/edit.vue"),
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
    path: "/company/employees",
    name: "company.employees",
    meta: {
      title: setTitle("Funcionários da empresa"),
      authRequired: true,
      permission: ["employees.index", "employees.read"],
    },
    component: () => import("@/pages/panels/owner/employees/index.vue"),
  },
  {
    path: "/company/employees/create",
    name: "company.employees.create",
    meta: {
      title: setTitle("Novo funcionário"),
      authRequired: true,
      permission: "employees.create",
    },
    component: () => import("@/pages/panels/owner/employees/create.vue"),
  },
  {
    path: "/company/employees/:id/edit",
    name: "company.employees.edit",
    meta: {
      title: setTitle("Editar funcionário"),
      authRequired: true,
      permission: "employees.update",
    },
    component: () => import("@/pages/panels/owner/employees/edit.vue"),
  },
  {
    path: "/company/employees/:id",
    name: "company.employees.view",
    meta: {
      title: setTitle("Visualizar funcionário"),
      authRequired: true,
      permission: "employees.read",
    },
    component: () => import("@/pages/panels/owner/employees/view.vue"),
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
    path: "/branch/employees",
    name: "branch.employees",
    meta: {
      title: setTitle("Funcionários da filial"),
      authRequired: true,
      permission: ["employees.index", "employees.read"],
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/pages/panels/owner/employees/index.vue"),
  },
  {
    path: "/branch/employees/create",
    name: "branch.employees.create",
    meta: {
      title: setTitle("Novo funcionário"),
      authRequired: true,
      permission: "employees.create",
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/pages/panels/owner/employees/create.vue"),
  },
  {
    path: "/branch/employees/:id/edit",
    name: "branch.employees.edit",
    meta: {
      title: setTitle("Editar funcionário"),
      authRequired: true,
      permission: "employees.update",
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/pages/panels/owner/employees/edit.vue"),
  },
  {
    path: "/branch/employees/:id",
    name: "branch.employees.view",
    meta: {
      title: setTitle("Visualizar funcionário"),
      authRequired: true,
      permission: "employees.read",
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/pages/panels/owner/employees/view.vue"),
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
  ...documentationLegacyRedirects,
  documentationRoutes,
  ...panelRoutes,
  ...errorRoutes,
];
