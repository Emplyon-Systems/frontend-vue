import type { RouteType } from "@/types/index";

export type MenuItemType = {
  key: string;
  label: string;
  isTitle?: boolean;
  icon?: string;
  /** Se definido, o item fica ativo quando `route.name` começa por este prefixo (ex.: páginas filhas da documentação). */
  activeRouteNamePrefix?: string;
  route?: RouteType;
  url?: string;
  badge?: {
    variant: string;
    text: string;
  };
  parentKey?: string;
  target?: string;
  disabled?: boolean;
  children?: MenuItemType[];
};

export type SubMenus = {
  item: MenuItemType;
  linkClassName?: string;
  subMenuClassName?: string;
  className?: string;
};
