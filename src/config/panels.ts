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
    allowedRoles: ["superadmin", "owner"],
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
    allowedRoles: ["user", "employee"],
    defaultRoute: "/employee",
  },
};

/**
 * Redireciona o utilizador para a home do painel correspondente ao seu role.
 * Prioridade: superadmin/owner -> owner, admin/empresa -> company, branch_manager/branch/filial -> branch, resto -> employee.
 */
export function getPanelHomeForUser(roles: { slug: string }[] | undefined): string {
  if (!roles?.length) return "/";
  const slugs = roles.map((r) => r.slug);
  if (slugs.some((s) => ["superadmin", "owner"].includes(s))) return PANEL_CONFIG.owner.defaultRoute;
  if (slugs.some((s) => ["admin", "empresa"].includes(s))) return PANEL_CONFIG.company.defaultRoute;
  if (slugs.some((s) => ["branch_manager", "branch", "filial"].includes(s))) return PANEL_CONFIG.branch.defaultRoute;
  return PANEL_CONFIG.employee.defaultRoute;
}
