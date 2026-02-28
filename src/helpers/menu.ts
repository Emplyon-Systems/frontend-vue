import { MENU_ITEMS } from "@/assets/data/menu-items";
import { getPanelHomeForUser } from "@/config/panels";
import type { MenuItemType } from "@/types/menu";

export { MENU_ITEMS };

const ownerSlugs = ["superadmin", "owner"];

/**
 * Menu com o Dashboard a apontar para o painel do utilizador (owner / company / employee).
 * No painel owner mostra "Sistema" com submenu: Utilizadores, Perfis, Permissões, Auditoria.
 */
export function getMenuItemsForUser(roles: { slug: string }[] | undefined): MenuItemType[] {
  const path = getPanelHomeForUser(roles);
  const isOwner = roles?.some((r) => ownerSlugs.includes(r.slug));

  if (isOwner && path === "/") {
    return [
      { key: "main", label: "Menu", isTitle: true },
      { key: "dashboard", icon: "iconoir-home-simple", label: "Dashboard", route: { name: "panels.owner.dashboard" } },
      {
        key: "sistema",
        icon: "iconoir-settings",
        label: "Sistema",
        children: [
          { key: "users", icon: "iconoir-user", label: "Utilizadores", route: { name: "owner.users" } },
          { key: "roles", icon: "iconoir-shield", label: "Perfis", route: { name: "owner.roles" } },
          { key: "permissions", icon: "iconoir-lock", label: "Permissões", route: { name: "owner.permissions" } },
          { key: "audits", icon: "iconoir-database", label: "Auditoria", route: { name: "owner.audits" } },
        ],
      },
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
  return [
    { key: "main", label: "Menu", isTitle: true },
    { key: "dashboard", icon: "iconoir-home-simple", label: "Dashboard", route: { name } },
  ];
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
