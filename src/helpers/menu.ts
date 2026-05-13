import { MENU_ITEMS } from "@/assets/data/menu-items";
import { getPanelHomeForUser, type UserPanelInput } from "@/config/panels";
import type { AuthContext } from "@/stores/auth";
import type { User } from "@/types/auth";
import type { MenuItemType } from "@/types/menu";

export { MENU_ITEMS };

const ownerSlugs = ["superadmin"];

/**
 * Menu com o Dashboard a apontar para o painel do usuário (owner / company / branch / employee).
 * O agrupador "Templates" usa ícone como outros menus com submenu; as entradas *dentro* de Templates não têm ícone (apenas texto + bullet lateral).
 */
export function getMenuItemsForUser(user: UserPanelInput | undefined, context?: AuthContext | null): MenuItemType[] {
  const path = getPanelHomeForUser(user, context);
  const roles = user?.roles;
  const isOwner = roles?.some((r) => ownerSlugs.includes(r.slug));
  const isSuperadmin = roles?.some((r) => r.slug === "superadmin");
  const rolePermissionSlugs = (roles ?? []).flatMap((role) => role.permissions?.map((p) => p.slug) ?? []);
  const directPermissionSlugs = (user as User | undefined)?.permissions?.map((p) => p.slug) ?? [];
  const permissionSet = new Set([...rolePermissionSlugs, ...directPermissionSlugs]);
  const hasAny = (prefixes: string[]) => prefixes.some((prefix) => permissionSet.has(prefix));
  const canCompaniesList = hasAny(["companies.index"]);
  const canCompanies = hasAny([
    "companies.read",
    "companies.create",
    "companies.update",
    "companies.delete",
    "companies.plucks",
  ]) || canCompaniesList;
  const canBranches = hasAny([
    "branches.index",
    "branches.read",
    "branches.create",
    "branches.update",
    "branches.delete",
    "branches.plucks",
  ]);
  const canSectors = hasAny([
    "sectors.index",
    "sectors.read",
    "sectors.create",
    "sectors.update",
    "sectors.delete",
    "sectors.plucks",
  ]);
  const canPositions = hasAny([
    "positions.index",
    "positions.read",
    "positions.create",
    "positions.update",
    "positions.delete",
    "positions.plucks",
  ]);
  const canEmployees = hasAny([
    "employees.index",
    "employees.read",
    "employees.create",
    "employees.update",
    "employees.delete",
    "employees.plucks",
  ]);
  const canModalityTypes = hasAny([
    "modality_types.index",
    "modality_types.read",
    "modality_types.create",
    "modality_types.update",
    "modality_types.delete",
    "modality_types.plucks",
  ]);
  const canScaleTypes = hasAny([
    "scale_types.index",
    "scale_types.read",
    "scale_types.create",
    "scale_types.update",
    "scale_types.delete",
    "scale_types.plucks",
  ]);
  const canDayOffModalities = hasAny([
    "day_off_modalities.index",
    "day_off_modalities.read",
    "day_off_modalities.create",
    "day_off_modalities.update",
    "day_off_modalities.delete",
    "day_off_modalities.plucks",
  ]);
  const canEmployeeLeaveRequests = hasAny([
    "employee_leave_requests.index",
    "employee_leave_requests.read",
    "employee_leave_requests.create",
    "employee_leave_requests.update",
    "employee_leave_requests.delete",
    "employee_leave_requests.plucks",
  ]);
  const canEmployeeDayOffs = hasAny([
    "employee_day_offs.index",
    "employee_day_offs.read",
    "employee_day_offs.create",
    "employee_day_offs.update",
    "employee_day_offs.delete",
    "employee_day_offs.plucks",
  ]);
  const companySelfRouteName = "company.my-company.view";
  const branchSelfRouteName = "branch.my-branch.view";

  const systemChildren: MenuItemType[] = [];
  if (path !== "/employee" && hasAny(["users.index", "users.read", "users.create", "users.update", "users.delete", "users.plucks"])) {
    systemChildren.push({ key: "users", icon: "iconoir-user", label: "Usuários", route: { name: "owner.users" } });
  }
  if (hasAny(["roles.index", "roles.read", "roles.create", "roles.update", "roles.delete", "roles.plucks"])) {
    systemChildren.push({ key: "roles", icon: "iconoir-shield", label: "Perfis", route: { name: "owner.roles" } });
  }
  /** Submenu agrupador: templates globais em vários domínios. */
  const templateMenuChildren: MenuItemType[] = [];
  if (
    isSuperadmin ||
    hasAny([
      "role_templates.index",
      "role_templates.read",
      "role_templates.update",
      "role_templates.create",
      "role_templates.delete",
    ])
  ) {
    templateMenuChildren.push({
      key: "role-templates",
      label: "Perfis",
      route: { name: "owner.role-templates" },
    });
  }
  if (
    isSuperadmin ||
    hasAny([
      "modality_type_templates.index",
      "modality_type_templates.read",
      "modality_type_templates.create",
      "modality_type_templates.update",
      "modality_type_templates.delete",
      "modality_type_templates.plucks",
    ])
  ) {
    templateMenuChildren.push({
      key: "modality-type-templates",
      label: "Modalidades de domingo",
      route: { name: "owner.modality-type-templates" },
    });
  }
  if (templateMenuChildren.length > 0) {
    systemChildren.push({
      key: "templates-hub",
      icon: "iconoir-book-stack",
      label: "Templates",
      children: templateMenuChildren,
    });
  }
  if (hasAny(["audits.index", "audits.read"])) {
    systemChildren.push({ key: "audits", icon: "iconoir-database", label: "Auditoria", route: { name: "owner.audits" } });
  }

  if (isOwner && path === "/") {
    return [
      { key: "main", label: "Menu", isTitle: true },
      { key: "dashboard", icon: "iconoir-home-simple", label: "Dashboard", route: { name: "panels.owner.dashboard" } },
      ...((isSuperadmin || canCompanies)
        ? [
            {
              key: "companies",
              icon: "iconoir-building",
              label: "Empresas",
              route: { name: "owner.companies" },
            } as MenuItemType,
          ]
        : []),
      ...(isSuperadmin
        ? [
            {
              key: "tutorials-admin",
              icon: "iconoir-play",
              label: "Tutoriais",
              children: [
                {
                  key: "tutorial-categories",
                  icon: "iconoir-book-stack",
                  label: "Categorias",
                  route: { name: "owner.tutorial-categories" },
                },
                {
                  key: "tutorials-content",
                  icon: "iconoir-page",
                  label: "Conteúdo",
                  route: { name: "owner.tutorials" },
                },
              ],
            } as MenuItemType,
          ]
        : []),
      ...(systemChildren.length
        ? [
            {
              key: "sistema",
              icon: "iconoir-settings",
              label: "Sistema",
              children: systemChildren,
            } as MenuItemType,
          ]
        : []),
    ];
  }

  const name =
    path === "/company"
      ? "panels.company.dashboard"
      : path === "/branch"
        ? "panels.branch.dashboard"
      : path === "/employee"
        ? "panels.employee.dashboard"
        : "panels.owner.dashboard";

  const baseMenu: MenuItemType[] = [
    { key: "main", label: "Menu", isTitle: true },
    { key: "dashboard", icon: "iconoir-home-simple", label: "Dashboard", route: { name } },
  ];
  if (path === "/employee" && canEmployeeLeaveRequests) {
    baseMenu.push({
      key: "employee-leave-requests",
      icon: "iconoir-calendar",
      label: "Solicitar folga",
      route: { name: "employee.leave-requests" },
    });
  }
  if (path === "/employee" && canEmployeeDayOffs) {
    baseMenu.push({
      key: "employee-day-offs",
      icon: "iconoir-calendar-minus",
      label: "Minhas folgas",
      route: { name: "employee.day-offs" },
    });
  }
  // Tutoriais no menu lateral: só superadmin; tenants acessam pelo cartão no rodapé da sidebar.
  // Perfil removido do sidebar — acessível apenas pelo dropdown do usuário (TopBar)

  if (path !== "/employee" && (canBranches || canCompanies || canSectors || canPositions || canEmployees || canModalityTypes || canScaleTypes || canDayOffModalities || canEmployeeLeaveRequests)) {
    const isBranchPanel = path === "/branch";
    if (isBranchPanel) {
      const branchManagementChildren: MenuItemType[] = [];
      const branchWorkforceChildren: MenuItemType[] = [];

      if (canBranches) {
        baseMenu.push({
          key: "branch",
          icon: "iconoir-git-branch",
          label: "Filial",
          route: { name: branchSelfRouteName },
        });
      }
      if (canSectors) {
        branchManagementChildren.push({
          key: "sectors-list",
          icon: "iconoir-folder",
          label: "Setores",
          route: { name: "branch.sectors" },
        });
      }
      if (canPositions) {
        branchManagementChildren.push({
          key: "positions-list",
          icon: "iconoir-user-crown",
          label: "Cargos",
          route: { name: "branch.positions" },
        });
      }
      if (canEmployees) {
        branchManagementChildren.push({
          key: "employees-list",
          icon: "iconoir-community",
          label: "Funcionários",
          route: { name: "branch.employees" },
        });
      }
      if (canEmployeeLeaveRequests) {
        baseMenu.push({
          key: "branch-leave-requests",
          icon: "iconoir-calendar",
          label: "Solicitações de folgas",
          route: { name: "branch.leave-requests" },
        });
      }
      if (canModalityTypes) {
        branchWorkforceChildren.push({
          key: "modality-types-list",
          icon: "iconoir-book",
          label: "Modalidade de domingo",
          route: { name: "branch.modality-types" },
        });
      }
      if (canDayOffModalities) {
        branchWorkforceChildren.push({
          key: "day-off-modalities-list",
          icon: "iconoir-calendar-minus",
          label: "Modalidades de folga",
          route: { name: "branch.day-off-modalities" },
        });
      }
      if (canScaleTypes) {
        branchWorkforceChildren.push({
          key: "scale-types-list",
          icon: "iconoir-calendar",
          label: "Tipos de escala",
          route: { name: "branch.scale-types" },
        });
      }
      if (branchManagementChildren.length) {
        baseMenu.push({
          key: "branch-management",
          icon: "iconoir-building",
          label: "Gestão da filial",
          children: branchManagementChildren,
        });
      }
      if (branchWorkforceChildren.length) {
        baseMenu.push({
          key: "branch-workforce",
          icon: "iconoir-clock",
          label: "Jornada",
          children: branchWorkforceChildren,
        });
      }
      if (systemChildren.length) {
        baseMenu.push({
          key: "sistema",
          icon: "iconoir-settings",
          label: "Sistema",
          children: systemChildren,
        });
      }
      return baseMenu;
    }

    /** Painel empresa: só organização (Minha empresa + Filiais). Setores/etc. só após entrar numa filial (tela Ver filial). */
    if (path === "/company") {
      baseMenu.push({
        key: "my-company-top",
        icon: "iconoir-building",
        label: "Minha empresa",
        route: { name: companySelfRouteName },
      });
      if (canBranches) {
        baseMenu.push({
          key: "branches-list",
          icon: "iconoir-git-branch",
          label: "Filiais",
          route: { name: "company.branches" },
        });
      }
      if (systemChildren.length) {
        baseMenu.push({
          key: "sistema",
          icon: "iconoir-settings",
          label: "Sistema",
          children: systemChildren,
        });
      }
      return baseMenu;
    }
  }

  // Sistema sempre por último (Empresas e Filial)
  if (systemChildren.length) {
    baseMenu.push({
      key: "sistema",
      icon: "iconoir-settings",
      label: "Sistema",
      children: systemChildren,
    });
  }

  return baseMenu;
}

export const getMenuItems = () => MENU_ITEMS;

export const findAllParent = (
  menuItems: MenuItemType[],
  menuItem: MenuItemType,
): string[] => {
  let parents: string[] = [];
  const parent = findMenuItem(menuItems, menuItem.parentKey);
  if (parent) {
    parents.push(parent.key);
    if (parent.parentKey) {
      parents = [...parents, ...findAllParent(menuItems, parent)];
    }
  }
  return parents;
};

export const getMenuItemFromURL = (
  items: MenuItemType | MenuItemType[],
  url: string,
): MenuItemType | undefined => {
  if (items instanceof Array) {
    for (const item of items) {
      const foundItem = getMenuItemFromURL(item, url);
      if (foundItem) {
        return foundItem;
      }
    }
  } else {
    if (items.url == url) return items;
    if (items.children != null) {
      for (const item of items.children) {
        if (item.url == url) return item;
      }
    }
  }
};

export const findMenuItem = (
  menuItems: MenuItemType[] | undefined,
  menuItemKey: MenuItemType["key"] | undefined,
): MenuItemType | null => {
  if (menuItems && menuItemKey) {
    for (const item of menuItems) {
      if (item.key === menuItemKey) {
        return item;
      }
      const found = findMenuItem(item.children, menuItemKey);
      if (found) return found;
    }
  }
  return null;
};
