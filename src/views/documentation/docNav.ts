/** Índice da documentação — rotas Vue Router; submenus com `children` */

export type DocNavLink = { name: string; label: string };

export type DocNavSubgroup = {
  id: string;
  label: string;
  children: DocNavLink[];
};

export type DocNavEntry = DocNavLink | DocNavSubgroup;

export type DocNavGroup = {
  id: string;
  title: string;
  items: DocNavEntry[];
};

export function isDocNavSubgroup(entry: DocNavEntry): entry is DocNavSubgroup {
  return Array.isArray((entry as DocNavSubgroup).children);
}

export const docNavGroups: DocNavGroup[] = [
  {
    id: "geral",
    title: "Geral",
    items: [{ name: "documentation.home", label: "Visão geral" }],
  },
  {
    id: "backend",
    title: "Backend",
    items: [
      { name: "documentation.backend.index", label: "Índice backend" },
      { name: "documentation.backend.architecture", label: "Arquitetura" },
      { name: "documentation.backend.moduloCompleto", label: "Módulo completo (exemplo)" },
      {
        id: "be-controllers",
        label: "Controllers",
        children: [
          { name: "documentation.backend.controllers.visao", label: "Visão geral" },
          { name: "documentation.backend.controllers.padrao", label: "Padrão" },
          { name: "documentation.backend.controllers.regras", label: "Regras" },
        ],
      },
      {
        id: "be-services",
        label: "Services",
        children: [
          { name: "documentation.backend.services.visao", label: "Visão geral" },
          { name: "documentation.backend.services.padrao", label: "Padrão" },
          { name: "documentation.backend.services.regras", label: "Regras" },
        ],
      },
      {
        id: "be-repositories",
        label: "Repositories",
        children: [
          { name: "documentation.backend.repositories.visao", label: "Visão geral" },
          { name: "documentation.backend.repositories.padrao", label: "Padrão" },
          { name: "documentation.backend.repositories.regras", label: "Regras" },
        ],
      },
      {
        id: "be-form-requests",
        label: "Form Requests",
        children: [
          { name: "documentation.backend.formRequests.visao", label: "Visão geral" },
          { name: "documentation.backend.formRequests.padrao", label: "Padrão" },
          { name: "documentation.backend.formRequests.regras", label: "Regras" },
        ],
      },
      {
        id: "be-policies",
        label: "Policies",
        children: [
          { name: "documentation.backend.policies.visao", label: "Visão geral" },
          { name: "documentation.backend.policies.padrao", label: "Padrão" },
          { name: "documentation.backend.policies.regras", label: "Regras" },
        ],
      },
      {
        id: "be-observers",
        label: "Observers",
        children: [
          { name: "documentation.backend.observers.visao", label: "Visão geral" },
          { name: "documentation.backend.observers.padrao", label: "Padrão" },
          { name: "documentation.backend.observers.regras", label: "Regras" },
        ],
      },
      { name: "documentation.backend.camadas", label: "Camadas e fluxo (resumo)" },
      { name: "documentation.backend.autorizacao", label: "Autorização" },
      { name: "documentation.backend.migrations", label: "Migrations e banco de dados" },
      { name: "documentation.backend.modelo-dados", label: "Modelo de dados" },
      { name: "documentation.backend.exemplo-users", label: "Exemplo: Users" },
      { name: "documentation.backend.api", label: "API HTTP" },
      { name: "documentation.backend.testes", label: "Testes (API e front)" },
    ],
  },
  {
    id: "frontend",
    title: "Frontend",
    items: [
      { name: "documentation.frontend.index", label: "Índice frontend" },
      { name: "documentation.frontend.architecture", label: "Arquitetura" },
      { name: "documentation.frontend.moduloCompleto", label: "Módulo completo (exemplo)" },
      {
        id: "fe-pages",
        label: "Pages",
        children: [
          { name: "documentation.frontend.pages.visao", label: "Visão geral" },
          { name: "documentation.frontend.pages.padrao", label: "Padrão" },
          { name: "documentation.frontend.pages.regras", label: "Regras" },
        ],
      },
      {
        id: "fe-views",
        label: "Views",
        children: [
          { name: "documentation.frontend.views.visao", label: "Visão geral" },
          { name: "documentation.frontend.views.padrao", label: "Padrão" },
          { name: "documentation.frontend.views.regras", label: "Regras" },
        ],
      },
      {
        id: "fe-router",
        label: "Rotas (Vue Router)",
        children: [
          { name: "documentation.frontend.router.visao", label: "Visão geral" },
          { name: "documentation.frontend.router.padrao", label: "Padrão" },
          { name: "documentation.frontend.router.regras", label: "Regras" },
        ],
      },
      {
        id: "fe-api",
        label: "API (cliente HTTP)",
        children: [
          { name: "documentation.frontend.api.visao", label: "Visão geral" },
          { name: "documentation.frontend.api.padrao", label: "Padrão" },
          { name: "documentation.frontend.api.regras", label: "Regras" },
        ],
      },
      { name: "documentation.frontend.estrutura", label: "Pastas e arquivos" },
      { name: "documentation.frontend.rotas-auth", label: "Guards e autenticação" },
    ],
  },
];

/** Breadcrumb: texto curto por rota */
export const docBreadcrumbLabels: Record<string, string> = {
  "documentation.home": "Visão geral",
  "documentation.markdown": "Fonte em Markdown",
  "documentation.backend.index": "Backend",
  "documentation.backend.architecture": "Arquitetura",
  "documentation.backend.moduloCompleto": "Módulo completo",
  "documentation.backend.controllers.visao": "Controllers — Visão",
  "documentation.backend.controllers.padrao": "Controllers — Padrão",
  "documentation.backend.controllers.regras": "Controllers — Regras",
  "documentation.backend.services.visao": "Services — Visão",
  "documentation.backend.services.padrao": "Services — Padrão",
  "documentation.backend.services.regras": "Services — Regras",
  "documentation.backend.repositories.visao": "Repositories — Visão",
  "documentation.backend.repositories.padrao": "Repositories — Padrão",
  "documentation.backend.repositories.regras": "Repositories — Regras",
  "documentation.backend.formRequests.visao": "Form Requests — Visão",
  "documentation.backend.formRequests.padrao": "Form Requests — Padrão",
  "documentation.backend.formRequests.regras": "Form Requests — Regras",
  "documentation.backend.policies.visao": "Policies — Visão",
  "documentation.backend.policies.padrao": "Policies — Padrão",
  "documentation.backend.policies.regras": "Policies — Regras",
  "documentation.backend.observers.visao": "Observers — Visão",
  "documentation.backend.observers.padrao": "Observers — Padrão",
  "documentation.backend.observers.regras": "Observers — Regras",
  "documentation.backend.camadas": "Camadas",
  "documentation.backend.autorizacao": "Autorização",
  "documentation.backend.migrations": "Migrations",
  "documentation.backend.modelo-dados": "Modelo de dados",
  "documentation.backend.exemplo-users": "Exemplo Users",
  "documentation.backend.api": "API HTTP",
  "documentation.backend.testes": "Testes",
  "documentation.frontend.index": "Frontend",
  "documentation.frontend.architecture": "Arquitetura",
  "documentation.frontend.moduloCompleto": "Módulo completo",
  "documentation.frontend.pages.visao": "Pages — Visão",
  "documentation.frontend.pages.padrao": "Pages — Padrão",
  "documentation.frontend.pages.regras": "Pages — Regras",
  "documentation.frontend.views.visao": "Views — Visão",
  "documentation.frontend.views.padrao": "Views — Padrão",
  "documentation.frontend.views.regras": "Views — Regras",
  "documentation.frontend.router.visao": "Rotas — Visão",
  "documentation.frontend.router.padrao": "Rotas — Padrão",
  "documentation.frontend.router.regras": "Rotas — Regras",
  "documentation.frontend.api.visao": "API cliente — Visão",
  "documentation.frontend.api.padrao": "API cliente — Padrão",
  "documentation.frontend.api.regras": "API cliente — Regras",
  "documentation.frontend.estrutura": "Estrutura",
  "documentation.frontend.rotas-auth": "Guards e auth",
};
