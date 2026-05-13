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
      title: setTitle("Registro"),
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
      title: setTitle("Recuperar senha"),
    },
    component: () => import("@/views/auth/reset-pass.vue"),
  },
  {
    path: "/auth/reset-password",
    name: "auth.reset-password",
    meta: {
      title: setTitle("Nova senha"),
    },
    component: () => import("@/views/auth/reset-password.vue"),
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

const legalRoutes = [
  {
    path: "/legal/privacy",
    name: "legal.privacy",
    meta: {
      title: setTitle("Política de Privacidade"),
      authRequired: true,
    },
    component: () => import("@/views/panels/common/legal/PrivacyPolicy.vue"),
  },
  {
    path: "/legal/terms",
    name: "legal.terms",
    meta: {
      title: setTitle("Termos de Uso"),
      authRequired: true,
    },
    component: () => import("@/views/panels/common/legal/TermsOfUse.vue"),
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
        path: "modality-types",
        name: "owner.company.workspace.modality-types",
        meta: { title: setTitle("Empresa — Modalidade de domingo"), authRequired: true, panel: "owner", permission: ["modality_types.index", "modality_types.read"] },
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
      {
        path: "positions",
        name: "owner.company.workspace.positions",
        meta: { title: setTitle("Empresa — Cargos"), authRequired: true, panel: "owner", permission: ["positions.index", "positions.read", "roles.index", "roles.read"] },
        component: () => import("@/pages/panels/owner/positions/index.vue"),
      },
      {
        path: "roles",
        name: "owner.company.workspace.roles",
        meta: { title: setTitle("Empresa — Perfis"), authRequired: true, panel: "owner", permission: ["roles.index", "roles.read"] },
        component: () => import("@/pages/panels/owner/roles/index.vue"),
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
    path: "/positions",
    name: "owner.positions",
    meta: {
      title: setTitle("Cargos"),
      authRequired: true,
      panel: "owner",
      permission: ["positions.index", "positions.read"],
    },
    component: () => import("@/pages/panels/owner/positions/index.vue"),
  },
  {
    path: "/positions/create",
    name: "owner.positions.create",
    meta: {
      title: setTitle("Novo cargo"),
      authRequired: true,
      panel: "owner",
      permission: "positions.create",
    },
    component: () => import("@/pages/panels/owner/positions/create.vue"),
  },
  {
    path: "/positions/:id/edit",
    name: "owner.positions.edit",
    meta: {
      title: setTitle("Editar cargo"),
      authRequired: true,
      panel: "owner",
      permission: "positions.update",
    },
    component: () => import("@/pages/panels/owner/positions/edit.vue"),
  },
  {
    path: "/positions/:id",
    name: "owner.positions.view",
    meta: {
      title: setTitle("Visualizar cargo"),
      authRequired: true,
      panel: "owner",
      permission: "positions.read",
    },
    component: () => import("@/pages/panels/owner/positions/view.vue"),
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
    path: "/employees/:employeeId/absences/:kind/create",
    name: "owner.employees.absences.create",
    meta: {
      title: setTitle("Novo registro"),
      authRequired: true,
      panel: "owner",
      permission: "employees.create",
    },
    component: () => import("@/views/panels/owner/employees/profile/EmployeePeriodRecordForm.vue"),
  },
  {
    path: "/employees/:employeeId/absences/:kind/:recordId/edit",
    name: "owner.employees.absences.edit",
    meta: {
      title: setTitle("Editar registro"),
      authRequired: true,
      panel: "owner",
      permission: "employees.update",
    },
    component: () => import("@/views/panels/owner/employees/profile/EmployeePeriodRecordForm.vue"),
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
    path: "/modality-types",
    name: "owner.modality-types",
    meta: {
      title: setTitle("Modalidade de domingo"),
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
      title: setTitle("Nova modalidade de domingo"),
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
      title: setTitle("Editar modalidade de domingo"),
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
      title: setTitle("Visualizar modalidade de domingo"),
      authRequired: true,
      panel: "owner",
      permission: "modality_types.read",
    },
    component: () => import("@/pages/panels/owner/modality-types/view.vue"),
  },
  {
    path: "/day-off-modalities",
    name: "owner.day-off-modalities",
    meta: {
      title: setTitle("Modalidades de folga"),
      authRequired: true,
      panel: "owner",
      permission: ["day_off_modalities.index", "day_off_modalities.read"],
    },
    component: () => import("@/pages/panels/owner/day-off-modalities/index.vue"),
  },
  {
    path: "/day-off-modalities/create",
    name: "owner.day-off-modalities.create",
    meta: { title: setTitle("Nova modalidade de folga"), authRequired: true, panel: "owner", permission: "day_off_modalities.create" },
    component: () => import("@/pages/panels/owner/day-off-modalities/create.vue"),
  },
  {
    path: "/day-off-modalities/:id/edit",
    name: "owner.day-off-modalities.edit",
    meta: { title: setTitle("Editar modalidade de folga"), authRequired: true, panel: "owner", permission: "day_off_modalities.update" },
    component: () => import("@/pages/panels/owner/day-off-modalities/edit.vue"),
  },
  {
    path: "/day-off-modalities/:id",
    name: "owner.day-off-modalities.view",
    meta: { title: setTitle("Visualizar modalidade de folga"), authRequired: true, panel: "owner", permission: "day_off_modalities.read" },
    component: () => import("@/pages/panels/owner/day-off-modalities/view.vue"),
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
    path: "/modality-type-templates",
    name: "owner.modality-type-templates",
    meta: {
      title: setTitle("Templates de modalidades"),
      authRequired: true,
      panel: "owner",
      permission: [
        "modality_type_templates.index",
        "modality_type_templates.read",
        "modality_type_templates.create",
        "modality_type_templates.update",
        "modality_type_templates.delete",
        "modality_type_templates.plucks",
      ],
    },
    component: () => import("@/pages/panels/owner/modality-type-templates/index.vue"),
  },
  {
    path: "/modality-type-templates/create",
    name: "owner.modality-type-templates.create",
    meta: {
      title: setTitle("Novo template de modalidade"),
      authRequired: true,
      panel: "owner",
      permission: ["modality_type_templates.create"],
    },
    component: () => import("@/pages/panels/owner/modality-type-templates/create.vue"),
  },
  {
    path: "/modality-type-templates/:id/edit",
    name: "owner.modality-type-templates.edit",
    meta: {
      title: setTitle("Editar template de modalidade"),
      authRequired: true,
      panel: "owner",
      permission: [
        "modality_type_templates.index",
        "modality_type_templates.read",
        "modality_type_templates.update",
        "modality_type_template_items.index",
        "modality_type_template_items.read",
        "modality_type_template_items.create",
        "modality_type_template_items.update",
        "modality_type_template_items.delete",
      ],
    },
    component: () => import("@/pages/panels/owner/modality-type-templates/edit.vue"),
  },
  {
    path: "/tutorial-categories",
    name: "owner.tutorial-categories",
    meta: {
      title: setTitle("Categorias de tutoriais"),
      authRequired: true,
      panel: "owner",
      permission: ["tutorial_categories.index", "tutorial_categories.read"],
    },
    component: () => import("@/pages/panels/owner/tutorial-categories/index.vue"),
  },
  {
    path: "/tutorial-categories/create",
    name: "owner.tutorial-categories.create",
    meta: {
      title: setTitle("Nova categoria de tutorial"),
      authRequired: true,
      panel: "owner",
      permission: "tutorial_categories.create",
    },
    component: () => import("@/pages/panels/owner/tutorial-categories/create.vue"),
  },
  {
    path: "/tutorial-categories/:id/edit",
    name: "owner.tutorial-categories.edit",
    meta: {
      title: setTitle("Editar categoria de tutorial"),
      authRequired: true,
      panel: "owner",
      permission: "tutorial_categories.update",
    },
    component: () => import("@/pages/panels/owner/tutorial-categories/edit.vue"),
  },
  {
    path: "/tutorials",
    name: "owner.tutorials",
    meta: {
      title: setTitle("Tutoriais (administração)"),
      authRequired: true,
      panel: "owner",
      permission: ["tutorials.index", "tutorials.read"],
    },
    component: () => import("@/pages/panels/owner/tutorials/index.vue"),
  },
  {
    path: "/tutorials/create",
    name: "owner.tutorials.create",
    meta: {
      title: setTitle("Novo tutorial"),
      authRequired: true,
      panel: "owner",
      permission: "tutorials.create",
    },
    component: () => import("@/pages/panels/owner/tutorials/create.vue"),
  },
  {
    path: "/tutorials/:id/edit",
    name: "owner.tutorials.edit",
    meta: {
      title: setTitle("Editar tutorial"),
      authRequired: true,
      panel: "owner",
      permission: "tutorials.update",
    },
    component: () => import("@/pages/panels/owner/tutorials/edit.vue"),
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
    name: "company.panel.workspace",
    meta: {
      authRequired: true,
    },
    component: () => import("@/layouts/CompanyPanelWorkspaceLayout.vue"),
    redirect: { name: "panels.company.dashboard" },
    children: [
      {
        path: "",
        name: "panels.company.dashboard",
        meta: {
          title: setTitle("Dashboard Empresa"),
          authRequired: true,
        },
        component: () => import("@/views/panels/company/dashboard/index.vue"),
      },
      {
        path: "my-company",
        name: "company.my-company.view",
        meta: {
          title: setTitle("Minha empresa"),
          authRequired: true,
        },
        component: () => import("@/views/panels/owner/companies/View.vue"),
      },
      {
        path: "my-company/edit",
        name: "company.my-company.edit",
        meta: {
          title: setTitle("Minha empresa"),
          authRequired: true,
        },
        component: () => import("@/views/panels/company/companies/EditMyCompany.vue"),
      },
      {
        path: "tutorials",
        name: "company.tutorials",
        meta: {
          title: setTitle("Tutoriais"),
          authRequired: true,
          permission: ["tutorials.index", "tutorials.read"],
        },
        component: () => import("@/pages/panels/company/tutorials/index.vue"),
      },
      {
        path: "tutorials/:id",
        name: "company.tutorials.detail",
        meta: {
          title: setTitle("Tutorial"),
          authRequired: true,
          permission: "tutorials.read",
        },
        component: () => import("@/pages/panels/company/tutorials/detail.vue"),
      },
      {
        path: "branches",
        name: "company.branches",
        meta: {
          title: setTitle("Filiais da empresa"),
          authRequired: true,
          permission: ["branches.index", "branches.read"],
        },
        component: () => import("@/pages/panels/owner/branches/index.vue"),
      },
      {
        path: "branches/create",
        name: "company.branches.create",
        meta: {
          title: setTitle("Nova filial"),
          authRequired: true,
          permission: "branches.create",
        },
        component: () => import("@/pages/panels/owner/branches/create.vue"),
      },
      {
        path: "branches/:id/edit",
        name: "company.branches.edit",
        meta: {
          title: setTitle("Editar filial"),
          authRequired: true,
          permission: "branches.update",
        },
        component: () => import("@/pages/panels/owner/branches/edit.vue"),
      },
      {
        path: "branches/:id",
        name: "company.branch.workspace",
        meta: {
          authRequired: true,
          permission: "branches.read",
        },
        component: () => import("@/layouts/CompanyBranchWorkspaceLayout.vue"),
        redirect: (to) =>
          ({ name: "company.branch.overview", params: { id: to.params.id } }) as const,
        children: [
          {
            path: "",
            name: "company.branch.overview",
            meta: {
              title: setTitle("Filial — Resumo"),
              authRequired: true,
              permission: "branches.read",
            },
            component: () => import("@/views/panels/owner/branches/View.vue"),
          },
          {
            path: "sectors",
            name: "company.branch.sectors",
            meta: {
              title: setTitle("Filial — Setores"),
              authRequired: true,
              permission: ["sectors.index", "sectors.read"],
            },
            component: () => import("@/pages/panels/owner/sectors/index.vue"),
          },
          {
            path: "employees",
            name: "company.branch.employees",
            meta: {
              title: setTitle("Filial — Funcionários"),
              authRequired: true,
              permission: ["employees.index", "employees.read"],
            },
            component: () => import("@/pages/panels/owner/employees/index.vue"),
          },
          {
            path: "users",
            name: "company.branch.users",
            meta: {
              title: setTitle("Filial — Usuários"),
              authRequired: true,
              permission: ["users.index", "users.read"],
            },
            component: () => import("@/pages/panels/owner/users/index.vue"),
          },
          {
            path: "roles",
            name: "company.branch.roles",
            meta: {
              title: setTitle("Filial — Perfis"),
              authRequired: true,
              permission: ["roles.index", "roles.read"],
            },
            component: () => import("@/pages/panels/owner/roles/index.vue"),
          },
          {
            path: "modality-types",
            name: "company.branch.modality-types",
            meta: {
              title: setTitle("Filial — Modalidade de domingo"),
              authRequired: true,
              permission: ["modality_types.index", "modality_types.read"],
            },
            component: () => import("@/pages/panels/owner/modality-types/index.vue"),
          },
          {
            path: "scale-types",
            name: "company.branch.scale-types",
            meta: {
              title: setTitle("Filial — Tipos de escala"),
              authRequired: true,
              permission: ["scale_types.index", "scale_types.read"],
            },
            component: () => import("@/pages/panels/owner/scale-types/index.vue"),
          },
          {
            path: "positions",
            name: "company.branch.positions",
            meta: {
              title: setTitle("Filial — Cargos"),
              authRequired: true,
              permission: ["positions.index", "positions.read", "roles.index", "roles.read"],
            },
            component: () => import("@/pages/panels/owner/positions/index.vue"),
          },
        ],
      },
      {
        path: "positions",
        name: "company.positions",
        meta: {
          title: setTitle("Cargos da empresa"),
          authRequired: true,
          permission: ["positions.index", "positions.read", "roles.index", "roles.read"],
        },
        component: () => import("@/pages/panels/owner/positions/index.vue"),
      },
      {
        path: "positions/create",
        name: "company.positions.create",
        meta: {
          title: setTitle("Novo cargo"),
          authRequired: true,
          permission: ["positions.create", "roles.create"],
        },
        component: () => import("@/pages/panels/owner/positions/create.vue"),
      },
      {
        path: "positions/:id/edit",
        name: "company.positions.edit",
        meta: {
          title: setTitle("Editar cargo"),
          authRequired: true,
          permission: ["positions.update", "roles.update"],
        },
        component: () => import("@/pages/panels/owner/positions/edit.vue"),
      },
      {
        path: "positions/:id",
        name: "company.positions.view",
        meta: {
          title: setTitle("Visualizar cargo"),
          authRequired: true,
          permission: ["positions.read", "roles.read"],
        },
        component: () => import("@/pages/panels/owner/positions/view.vue"),
      },
      {
        path: "sectors",
        name: "company.sectors",
        meta: {
          title: setTitle("Setores da empresa"),
          authRequired: true,
          permission: ["sectors.index", "sectors.read"],
        },
        component: () => import("@/pages/panels/owner/sectors/index.vue"),
      },
      {
        path: "sectors/create",
        name: "company.sectors.create",
        meta: {
          title: setTitle("Novo setor"),
          authRequired: true,
          permission: "sectors.create",
        },
        component: () => import("@/pages/panels/owner/sectors/create.vue"),
      },
      {
        path: "sectors/:id/edit",
        name: "company.sectors.edit",
        meta: {
          title: setTitle("Editar setor"),
          authRequired: true,
          permission: "sectors.update",
        },
        component: () => import("@/pages/panels/owner/sectors/edit.vue"),
      },
      {
        path: "sectors/:id",
        name: "company.sectors.view",
        meta: {
          title: setTitle("Visualizar setor"),
          authRequired: true,
          permission: "sectors.read",
        },
        component: () => import("@/pages/panels/owner/sectors/view.vue"),
      },
      {
        path: "employees",
        name: "company.employees",
        meta: {
          title: setTitle("Funcionários da empresa"),
          authRequired: true,
          permission: ["employees.index", "employees.read"],
        },
        component: () => import("@/pages/panels/owner/employees/index.vue"),
      },
      {
        path: "employees/create",
        name: "company.employees.create",
        meta: {
          title: setTitle("Novo funcionário"),
          authRequired: true,
          permission: "employees.create",
        },
        component: () => import("@/pages/panels/owner/employees/create.vue"),
      },
      {
        path: "employees/:id/edit",
        name: "company.employees.edit",
        meta: {
          title: setTitle("Editar funcionário"),
          authRequired: true,
          permission: "employees.update",
        },
        component: () => import("@/pages/panels/owner/employees/edit.vue"),
      },
      {
        path: "employees/:employeeId/absences/:kind/create",
        name: "company.employees.absences.create",
        meta: {
          title: setTitle("Novo registro"),
          authRequired: true,
          permission: "employees.create",
        },
        component: () => import("@/views/panels/owner/employees/profile/EmployeePeriodRecordForm.vue"),
      },
      {
        path: "employees/:employeeId/absences/:kind/:recordId/edit",
        name: "company.employees.absences.edit",
        meta: {
          title: setTitle("Editar registro"),
          authRequired: true,
          permission: "employees.update",
        },
        component: () => import("@/views/panels/owner/employees/profile/EmployeePeriodRecordForm.vue"),
      },
      {
        path: "employees/:id",
        name: "company.employees.view",
        meta: {
          title: setTitle("Visualizar funcionário"),
          authRequired: true,
          permission: "employees.read",
        },
        component: () => import("@/pages/panels/owner/employees/view.vue"),
      },
      {
        path: "modality-types",
        name: "company.modality-types",
        meta: {
          title: setTitle("Modalidade de domingo (empresa)"),
          authRequired: true,
          permission: ["modality_types.index", "modality_types.read"],
        },
        component: () => import("@/pages/panels/owner/modality-types/index.vue"),
      },
      {
        path: "modality-types/create",
        name: "company.modality-types.create",
        meta: {
          title: setTitle("Nova modalidade de domingo"),
          authRequired: true,
          permission: "modality_types.create",
        },
        component: () => import("@/pages/panels/owner/modality-types/create.vue"),
      },
      {
        path: "modality-types/:id/edit",
        name: "company.modality-types.edit",
        meta: {
          title: setTitle("Editar modalidade de domingo"),
          authRequired: true,
          permission: "modality_types.update",
        },
        component: () => import("@/pages/panels/owner/modality-types/edit.vue"),
      },
      {
        path: "modality-types/:id",
        name: "company.modality-types.view",
        meta: {
          title: setTitle("Visualizar modalidade de domingo"),
          authRequired: true,
          permission: "modality_types.read",
        },
        component: () => import("@/pages/panels/owner/modality-types/view.vue"),
      },
      {
        path: "day-off-modalities",
        name: "company.day-off-modalities",
        meta: { title: setTitle("Modalidades de folga"), authRequired: true, permission: ["day_off_modalities.index", "day_off_modalities.read"] },
        component: () => import("@/pages/panels/owner/day-off-modalities/index.vue"),
      },
      {
        path: "day-off-modalities/create",
        name: "company.day-off-modalities.create",
        meta: { title: setTitle("Nova modalidade de folga"), authRequired: true, permission: "day_off_modalities.create" },
        component: () => import("@/pages/panels/owner/day-off-modalities/create.vue"),
      },
      {
        path: "day-off-modalities/:id/edit",
        name: "company.day-off-modalities.edit",
        meta: { title: setTitle("Editar modalidade de folga"), authRequired: true, permission: "day_off_modalities.update" },
        component: () => import("@/pages/panels/owner/day-off-modalities/edit.vue"),
      },
      {
        path: "day-off-modalities/:id",
        name: "company.day-off-modalities.view",
        meta: { title: setTitle("Visualizar modalidade de folga"), authRequired: true, permission: "day_off_modalities.read" },
        component: () => import("@/pages/panels/owner/day-off-modalities/view.vue"),
      },
      {
        path: "scale-types",
        name: "company.scale-types",
        meta: {
          title: setTitle("Tipos de escala da empresa"),
          authRequired: true,
          permission: ["scale_types.index", "scale_types.read"],
        },
        component: () => import("@/pages/panels/owner/scale-types/index.vue"),
      },
      {
        path: "scale-types/create",
        name: "company.scale-types.create",
        meta: {
          title: setTitle("Novo tipo de escala"),
          authRequired: true,
          permission: "scale_types.create",
        },
        component: () => import("@/pages/panels/owner/scale-types/create.vue"),
      },
      {
        path: "scale-types/:id/edit",
        name: "company.scale-types.edit",
        meta: {
          title: setTitle("Editar tipo de escala"),
          authRequired: true,
          permission: "scale_types.update",
        },
        component: () => import("@/pages/panels/owner/scale-types/edit.vue"),
      },
      {
        path: "scale-types/:id",
        name: "company.scale-types.view",
        meta: {
          title: setTitle("Visualizar tipo de escala"),
          authRequired: true,
          permission: "scale_types.read",
        },
        component: () => import("@/pages/panels/owner/scale-types/view.vue"),
      },
    ],
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
    path: "/branch/tutorials",
    name: "branch.tutorials",
    meta: {
      title: setTitle("Tutoriais"),
      authRequired: true,
      permission: ["tutorials.index", "tutorials.read"],
      role: ["branch_manager", "branch", "filial", "setor"],
      rolePrefix: ["filial-b", "setor-b"],
    },
    component: () => import("@/pages/panels/branch/tutorials/index.vue"),
  },
  {
    path: "/branch/tutorials/:id",
    name: "branch.tutorials.detail",
    meta: {
      title: setTitle("Tutorial"),
      authRequired: true,
      permission: "tutorials.read",
      role: ["branch_manager", "branch", "filial", "setor"],
      rolePrefix: ["filial-b", "setor-b"],
    },
    component: () => import("@/pages/panels/branch/tutorials/detail.vue"),
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
    path: "/branch/positions",
    name: "branch.positions",
    meta: {
      title: setTitle("Cargos da filial"),
      authRequired: true,
      permission: ["positions.index", "positions.read"],
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/pages/panels/owner/positions/index.vue"),
  },
  {
    path: "/branch/positions/create",
    name: "branch.positions.create",
    meta: {
      title: setTitle("Novo cargo"),
      authRequired: true,
      permission: "positions.create",
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/pages/panels/owner/positions/create.vue"),
  },
  {
    path: "/branch/positions/:id/edit",
    name: "branch.positions.edit",
    meta: {
      title: setTitle("Editar cargo"),
      authRequired: true,
      permission: "positions.update",
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/pages/panels/owner/positions/edit.vue"),
  },
  {
    path: "/branch/positions/:id",
    name: "branch.positions.view",
    meta: {
      title: setTitle("Visualizar cargo"),
      authRequired: true,
      permission: "positions.read",
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/pages/panels/owner/positions/view.vue"),
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
    path: "/branch/employees/:employeeId/absences/:kind/create",
    name: "branch.employees.absences.create",
    meta: {
      title: setTitle("Novo registro"),
      authRequired: true,
      permission: "employees.create",
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/views/panels/owner/employees/profile/EmployeePeriodRecordForm.vue"),
  },
  {
    path: "/branch/employees/:employeeId/absences/:kind/:recordId/edit",
    name: "branch.employees.absences.edit",
    meta: {
      title: setTitle("Editar registro"),
      authRequired: true,
      permission: "employees.update",
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/views/panels/owner/employees/profile/EmployeePeriodRecordForm.vue"),
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
    path: "/branch/leave-requests",
    name: "branch.leave-requests",
    meta: {
      title: setTitle("Solicitações de folgas"),
      authRequired: true,
      permission: ["employee_leave_requests.index", "employee_leave_requests.read"],
      role: ["branch_manager", "branch", "filial", "setor"],
      rolePrefix: ["filial-b", "setor-b"],
    },
    component: () => import("@/views/panels/branch/leave-requests/index.vue"),
  },
  {
    path: "/branch/notifications",
    name: "branch.notifications",
    meta: {
      title: setTitle("Notificações"),
      authRequired: true,
      permission: ["employee_leave_requests.index", "employee_leave_requests.read"],
      role: ["branch_manager", "branch", "filial", "setor"],
      rolePrefix: ["filial-b", "setor-b"],
    },
    component: () => import("@/views/panels/common/notifications/index.vue"),
  },
  {
    path: "/branch/modality-types",
    name: "branch.modality-types",
    meta: {
      title: setTitle("Modalidade de domingo (filial)"),
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
      title: setTitle("Nova modalidade de domingo"),
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
      title: setTitle("Editar modalidade de domingo"),
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
      title: setTitle("Visualizar modalidade de domingo"),
      authRequired: true,
      permission: "modality_types.read",
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/pages/panels/owner/modality-types/view.vue"),
  },
  {
    path: "/branch/day-off-modalities",
    name: "branch.day-off-modalities",
    meta: {
      title: setTitle("Modalidades de folga da filial"),
      authRequired: true,
      permission: ["day_off_modalities.index", "day_off_modalities.read"],
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/pages/panels/owner/day-off-modalities/index.vue"),
  },
  {
    path: "/branch/day-off-modalities/create",
    name: "branch.day-off-modalities.create",
    meta: {
      title: setTitle("Nova modalidade de folga"),
      authRequired: true,
      permission: "day_off_modalities.create",
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/pages/panels/owner/day-off-modalities/create.vue"),
  },
  {
    path: "/branch/day-off-modalities/:id/edit",
    name: "branch.day-off-modalities.edit",
    meta: {
      title: setTitle("Editar modalidade de folga"),
      authRequired: true,
      permission: "day_off_modalities.update",
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/pages/panels/owner/day-off-modalities/edit.vue"),
  },
  {
    path: "/branch/day-off-modalities/:id",
    name: "branch.day-off-modalities.view",
    meta: {
      title: setTitle("Visualizar modalidade de folga"),
      authRequired: true,
      permission: "day_off_modalities.read",
      role: ["branch_manager", "branch", "filial"],
      rolePrefix: ["filial-b"],
    },
    component: () => import("@/pages/panels/owner/day-off-modalities/view.vue"),
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
    path: "/employee/tutorials",
    name: "employee.tutorials",
    meta: {
      title: setTitle("Tutoriais"),
      authRequired: true,
      permission: ["tutorials.index", "tutorials.read"],
      role: ["user", "employee", "colaborador"],
      rolePrefix: ["colaborador-b"],
    },
    component: () => import("@/pages/panels/employee/tutorials/index.vue"),
  },
  {
    path: "/employee/tutorials/:id",
    name: "employee.tutorials.detail",
    meta: {
      title: setTitle("Tutorial"),
      authRequired: true,
      permission: "tutorials.read",
      role: ["user", "employee", "colaborador"],
      rolePrefix: ["colaborador-b"],
    },
    component: () => import("@/pages/panels/employee/tutorials/detail.vue"),
  },
  {
    path: "/employee/leave-requests",
    name: "employee.leave-requests",
    meta: {
      title: setTitle("Solicitações de folga"),
      authRequired: true,
      permission: ["employee_leave_requests.index", "employee_leave_requests.read"],
      role: ["user", "employee", "colaborador"],
      rolePrefix: ["colaborador-b"],
    },
    component: () => import("@/views/panels/employee/leave-requests/index.vue"),
  },
  {
    path: "/employee/leave-requests/create",
    name: "employee.leave-requests.create",
    meta: {
      title: setTitle("Solicitar folga"),
      authRequired: true,
      permission: "employee_leave_requests.create",
      role: ["user", "employee", "colaborador"],
      rolePrefix: ["colaborador-b"],
    },
    component: () => import("@/views/panels/employee/leave-requests/create.vue"),
  },
  {
    path: "/employee/day-offs",
    name: "employee.day-offs",
    meta: {
      title: setTitle("Minhas folgas"),
      authRequired: true,
      permission: ["employee_day_offs.index", "employee_day_offs.read"],
      role: ["user", "employee", "colaborador"],
      rolePrefix: ["colaborador-b"],
    },
    component: () => import("@/views/panels/employee/day-offs/index.vue"),
  },
  {
    path: "/employee/notifications",
    name: "employee.notifications",
    meta: {
      title: setTitle("Notificações"),
      authRequired: true,
      permission: ["employee_leave_requests.index", "employee_leave_requests.read"],
      role: ["user", "employee", "colaborador"],
      rolePrefix: ["colaborador-b"],
    },
    component: () => import("@/views/panels/common/notifications/index.vue"),
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
  ...legalRoutes,
  ...documentationLegacyRedirects,
  documentationRoutes,
  ...panelRoutes,
  ...errorRoutes,
];
