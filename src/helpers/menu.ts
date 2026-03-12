import { MENU_ITEMS } from "@/assets/data/menu-items";
import { getPanelHomeForUser, type UserPanelInput } from "@/config/panels";
import type { User } from "@/types/auth";
import type { MenuItemType } from "@/types/menu";

export { MENU_ITEMS };

const ownerSlugs = ["superadmin"];

/**
 * Menu com o Dashboard a apontar para o painel do utilizador (owner / company / branch / employee).
 * No painel owner mostra "Sistema" com submenu: Usuários, Perfis, Auditoria.
 */
export function getMenuItemsForUser(user: UserPanelInput | undefined): MenuItemType[] {
  const path = getPanelHomeForUser(user);
  const roles = user?.roles;
  const isOwner = roles?.some((r) => ownerSlugs.includes(r.slug));
  const isSuperadmin = roles?.some((r) => r.slug === "superadmin");
  const branchRouteName = path === "/company" ? "company.branches" : "owner.branches";
  const permissionSet = new Set((roles ?? []).flatMap((role) => role.permissions?.map((p) => p.slug) ?? []));
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
  const companiesRouteName = path === "/company" ? "company.branches" : "owner.companies";
  const companySelfRouteName = "company.my-company.view";
  const branchSelfRouteName = "branch.my-branch.view";

  const systemChildren: MenuItemType[] = [];
  if (path !== "/employee" && hasAny(["users.index", "users.read", "users.create", "users.update", "users.delete", "users.plucks"])) {
    systemChildren.push({ key: "users", icon: "iconoir-user", label: "Usuários", route: { name: "owner.users" } });
  }
  if (hasAny(["roles.index", "roles.read", "roles.create", "roles.update", "roles.delete", "roles.plucks"])) {
    systemChildren.push({ key: "roles", icon: "iconoir-shield", label: "Perfis", route: { name: "owner.roles" } });
  }
  if (hasAny(["audits.index", "audits.read"])) {
    systemChildren.push({ key: "audits", icon: "iconoir-database", label: "Auditoria", route: { name: "owner.audits" } });
  }

  if (isOwner && path === "/") {
    return [
      { key: "main", label: "Menu", isTitle: true },
      { key: "dashboard", icon: "iconoir-home-simple", label: "Dashboard", route: { name: "panels.owner.dashboard" } },
      ...((isSuperadmin || canCompanies || canBranches || canSectors || canShifts || canModalityTypes || canScaleTypes)
        ? [
            {
              key: "companies",
              icon: "iconoir-building",
              label: "Empresas",
              route: { name: companiesRouteName },
              children: [
                ...(canCompaniesList || isSuperadmin
                  ? [
                      {
                        key: "companies-list",
                        icon: "iconoir-building",
                        label: "Empresas",
                        route: { name: "owner.companies" },
                      } as MenuItemType,
                    ]
                  : []),
                ...(canBranches
                  ? [
                      {
                        key: "branches-list",
                        icon: "iconoir-git-branch",
                        label: "Filiais",
                        route: { name: branchRouteName },
                      } as MenuItemType,
                    ]
                  : []),
                ...(isSuperadmin || canShifts
                  ? [
                      {
                        key: "shifts-list",
                        icon: "iconoir-clock",
                        label: "Turnos",
                        route: { name: "owner.shifts" },
                      } as MenuItemType,
                    ]
                  : []),
                ...(isSuperadmin || canModalityTypes
                  ? [
                      {
                        key: "modality-types-list",
                        icon: "iconoir-book",
                        label: "Modalidades",
                        route: { name: "owner.modality-types" },
                      } as MenuItemType,
                    ]
                  : []),
                ...(isSuperadmin || canScaleTypes
                  ? [
                      {
                        key: "scale-types-list",
                        icon: "iconoir-calendar",
                        label: "Tipos de escala",
                        route: { name: "owner.scale-types" },
                      } as MenuItemType,
                    ]
                  : []),
                ...(isSuperadmin || canSectors
                  ? [
                      {
                        key: "sectors-list",
                        icon: "iconoir-folder",
                        label: "Setores",
                        route: {
                          name: "owner.sectors",
                        },
                      } as MenuItemType,
                    ]
                  : []),
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
  const myProfileRouteName =
    path === "/company"
      ? "company.my-profile.view"
      : path === "/branch"
        ? "branch.my-profile.view"
        : path === "/employee"
          ? "employee.my-profile.view"
          : "owner.my-profile.view";

  const baseMenu: MenuItemType[] = [
    { key: "main", label: "Menu", isTitle: true },
    { key: "dashboard", icon: "iconoir-home-simple", label: "Dashboard", route: { name } },
    { key: "my-profile", icon: "iconoir-user", label: "Perfil", route: { name: myProfileRouteName } },
  ];

  if (path !== "/employee" && (canBranches || canCompanies || canSectors || canShifts || canModalityTypes || canScaleTypes)) {
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
          label: "Modalidades",
          route: { name: "branch.modality-types" },
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

    baseMenu.push({
      key: isBranchPanel ? "branch" : "companies",
      icon: isBranchPanel ? "iconoir-git-branch" : "iconoir-building",
      label: isBranchPanel ? "Filial" : "Empresas",
      route: { name: isBranchPanel ? branchSelfRouteName : companiesRouteName },
      children: [
        ...(path === "/company" && canCompanies
          ? [
              {
                key: "my-company-view",
                icon: "iconoir-eye",
                label: "Minha empresa",
                route: { name: companySelfRouteName },
              } as MenuItemType,
            ]
          : []),
        ...(canCompaniesList && isOwner
          ? [
              {
                key: "companies-list",
                icon: "iconoir-building",
                label: "Empresas",
                route: { name: "owner.companies" },
              } as MenuItemType,
            ]
          : []),
        ...(canBranches
          ? [
              {
                key: "branches-list",
                icon: "iconoir-git-branch",
                label: "Filiais",
                route: { name: branchRouteName },
              } as MenuItemType,
            ]
          : []),
        ...(canShifts
          ? [
              {
                key: "shifts-list",
                icon: "iconoir-clock",
                label: "Turnos",
                route: { name: path === "/company" ? "company.shifts" : "owner.shifts" },
              } as MenuItemType,
            ]
          : []),
        ...(canModalityTypes
          ? [
              {
                key: "modality-types-list",
                icon: "iconoir-book",
                label: "Modalidades",
                route: { name: path === "/company" ? "company.modality-types" : "owner.modality-types" },
              } as MenuItemType,
            ]
          : []),
        ...(canScaleTypes
          ? [
              {
                key: "scale-types-list",
                icon: "iconoir-calendar",
                label: "Tipos de escala",
                route: { name: path === "/company" ? "company.scale-types" : "owner.scale-types" },
              } as MenuItemType,
            ]
          : []),
        ...(canSectors
          ? [
              {
                key: "sectors-list",
                icon: "iconoir-folder",
                label: "Setores",
                route: { name: path === "/company" ? "company.sectors" : "owner.sectors" },
              } as MenuItemType,
            ]
          : []),
      ],
    });
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
