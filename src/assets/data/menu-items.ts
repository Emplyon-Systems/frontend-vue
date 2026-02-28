import type { MenuItemType } from "@/types/menu";

export const MENU_ITEMS: MenuItemType[] = [
  {
    key: "main",
    label: "Menu",
    isTitle: true,
  },
  {
    key: "dashboard",
    icon: "iconoir-home-simple",
    label: "Dashboard",
    route: { name: "panels.owner.dashboard" },
  },
];
