import type { User } from "@/types/auth";

/**
 * Configuração dos painéis (owner, company, branch, employee).
 * Usado pelo router e pelo redirect após login (getPanelHomeForUser).
 */

export interface PanelConfig {
  path: string;
  allowedRoles: string[];
  defaultRoute: string;
}

export const PANEL_CONFIG: Record<string, PanelConfig> = {
  owner: {
    path: "/",
    allowedRoles: ["superadmin"],
    defaultRoute: "/",
  },
  company: {
    path: "/company",
    allowedRoles: ["admin", "empresa", "branch", "filial"],
    defaultRoute: "/company",
  },
  branch: {
    path: "/branch",
    allowedRoles: ["branch_manager", "branch", "filial"],
    defaultRoute: "/branch",
  },
  employee: {
    path: "/employee",
    allowedRoles: ["user", "employee", "colaborador"],
    defaultRoute: "/employee",
  },
};

/** Utilizador mínimo para decidir o painel (roles + vínculos empresa/filial). */
export type UserPanelInput = Pick<User, "roles" | "permissions"> & {
  companies?: Array<{ id: number }>;
  branches?: Array<{ id: number }>;
};
export type PanelContextInput = {
  company_id: number;
  branch_id?: number | null;
} | null | undefined;

/**
 * Redireciona o utilizador para a home do painel conforme perfis e vínculos (empresa/filial).
 * Regras: superadmin → owner; só colaborador → employee; tem perfil de filial e está atribuído a filial(ais) → branch;
 * tem perfil de empresa e está atribuído a empresa(s) → company; senão → employee.
 */
export function getPanelHomeForUser(user: UserPanelInput | undefined, context?: PanelContextInput): string {
  const roles = user?.roles;
  if (!roles?.length) return PANEL_CONFIG.employee.defaultRoute;

  const slugs = roles.map((r) => r.slug);
  const hasBranches = (user?.branches?.length ?? 0) > 0;
  const hasCompanies = (user?.companies?.length ?? 0) > 0;

  const isCollaboratorRole = (slug: string) => slug === "colaborador" || slug.startsWith("colaborador-b");
  const isBranchScopedRole = (slug: string) =>
    !isCollaboratorRole(slug) && (slug.startsWith("filial-b") || /-b\d+$/.test(slug));
  const hasBranchRole = () =>
    slugs.some((s) => ["branch_manager", "branch", "filial"].includes(s) || isBranchScopedRole(s));
  const hasCompanyScopedRole = (slug: string) => ["admin", "empresa"].includes(slug) || /-c\d+$/.test(slug);
  const hasCompanyRole = () => slugs.some(hasCompanyScopedRole);
  const onlyCollaborator = () => slugs.every((s) => isCollaboratorRole(s));

  if (slugs.includes("superadmin")) return PANEL_CONFIG.owner.defaultRoute;
  if (onlyCollaborator()) return PANEL_CONFIG.employee.defaultRoute;
  if (context) {
    if (context.branch_id != null && hasBranchRole()) return PANEL_CONFIG.branch.defaultRoute;
    if (context.company_id && hasCompanyRole()) return PANEL_CONFIG.company.defaultRoute;
  }
  if (hasBranchRole() && hasBranches) return PANEL_CONFIG.branch.defaultRoute;
  if (hasCompanyRole() && hasCompanies) return PANEL_CONFIG.company.defaultRoute;

  return PANEL_CONFIG.employee.defaultRoute;
}
