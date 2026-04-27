import { MENU_ITEMS } from "@/assets/data/menu-items";
import { getPanelHomeForUser, type UserPanelInput } from "@/config/panels";
import type { AuthContext } from "@/stores/auth";
import type { User } from "@/types/auth";
import type { MenuItemType } from "@/types/menu";

export { MENU_ITEMS };

const ownerSlugs = ["superadmin"];

/**
 * Menu com o Dashboard a apontar para o painel do usuário (owner / company / branch / employee).
 * No painel owner mostra "Sistema" com submenu: Usuários, Perfis, Auditoria.
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
  const canShifts = hasAny([
    "shifts.index",
    "shifts.read",
    "shifts.create",
    "shifts.update",
    "shifts.delete",
    "shifts.plucks",
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
  /** Superadmin vê sempre; outros precisam das permissões (payload /me pode não listar tudo até novo login após seed). */
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
    systemChildren.push({
      key: "role-templates",
      icon: "iconoir-book-stack",
      label: "Templates de perfil",
      route: { name: "owner.role-templates" },
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
  // Perfil removido do sidebar — acessível apenas pelo dropdown do usuário (TopBar)

  if (path !== "/employee" && (canBranches || canCompanies || canSectors || canPositions || canEmployees || canShifts || canModalityTypes || canScaleTypes || canEmployeeLeaveRequests)) {
  if (path !== "/employee" && (canBranches || canCompanies || canSectors || canPositions || canEmployees || canShifts || canModalityTypes || canScaleTypes || canDayOffModalities || canEmployeeLeaveRequests)) {
    const isBranchPanel = path === "/branch";
    if (isBranchPanel) {
      if (canBranches) {
        baseMenu.push({
          key: "branch",
          icon: "iconoir-git-branch",
          label: "Filial",
          route: { name: branchSelfRouteName },
        });
      }
      if (canSectors) {
        baseMenu.push({
          key: "sectors-list",
          icon: "iconoir-folder",
          label: "Setores",
          route: { name: "branch.sectors" },
        });
      }
      if (canPositions) {
        baseMenu.push({
          key: "positions-list",
          icon: "iconoir-user-crown",
          label: "Cargos",
          route: { name: "branch.positions" },
        });
      }
      if (canEmployees) {
        baseMenu.push({
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
      if (canShifts) {
        baseMenu.push({
          key: "shifts-list",
          icon: "iconoir-clock",
          label: "Turnos",
          route: { name: "branch.shifts" },
        });
      }
      if (canModalityTypes) {
        baseMenu.push({
          key: "modality-types-list",
          icon: "iconoir-book",
          label: "Modalidade de domingo",
          route: { name: "branch.modality-types" },
        });
      }
      if (canDayOffModalities) {
        baseMenu.push({
          key: "day-off-modalities-list",
          icon: "iconoir-calendar-minus",
          label: "Modalidades de folga",
          route: { name: "branch.day-off-modalities" },
        });
      }
      if (canScaleTypes) {
        baseMenu.push({
          key: "scale-types-list",
          icon: "iconoir-calendar",
          label: "Tipos de escala",
          route: { name: "branch.scale-types" },
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

    /** Painel empresa: só organização (Minha empresa + Filiais). Setores/turnos/etc. só após entrar numa filial (ecrã Ver filial). */
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
