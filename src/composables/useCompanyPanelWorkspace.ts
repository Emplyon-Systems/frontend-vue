import { computed } from "vue";
import { useRoute } from "vue-router";

/** Nome da rota pai que envolve o painel empresa (router-view). */
export const COMPANY_PANEL_WORKSPACE_ROUTE_NAME = "company.panel.workspace";

export function useCompanyPanelWorkspaceLayout() {
  const route = useRoute();
  const isInsideCompanyPanelWorkspace = computed(() =>
    route.matched.some((r) => r.name === COMPANY_PANEL_WORKSPACE_ROUTE_NAME),
  );
  return { isInsideCompanyPanelWorkspace };
}
