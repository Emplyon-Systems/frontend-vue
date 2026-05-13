import { computed } from "vue";
import { useRoute } from "vue-router";

/** Nomes de rotas pai que já fornecem um layout (DefaultLayout incluído). */
const WORKSPACE_ROUTE_NAMES = [
  "company.panel.workspace",
  "owner.company.workspace",
  "owner.branch.workspace",
] as const;

/** @deprecated use WORKSPACE_ROUTE_NAMES */
export const COMPANY_PANEL_WORKSPACE_ROUTE_NAME = "company.panel.workspace";

export function useCompanyPanelWorkspaceLayout() {
  const route = useRoute();
  const isInsideCompanyPanelWorkspace = computed(() =>
    route.matched.some((r) => WORKSPACE_ROUTE_NAMES.includes(r.name as any)),
  );
  return { isInsideCompanyPanelWorkspace };
}
