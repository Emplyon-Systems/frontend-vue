import { computed } from "vue";
import { useRoute } from "vue-router";

export const COMPANY_BRANCH_WORKSPACE_ROUTE_NAME = "company.branch.workspace";

export function useCompanyBranchWorkspace() {
  const route = useRoute();
  const isCompanyBranchWorkspace = computed(() =>
    route.matched.some((r) => r.name === COMPANY_BRANCH_WORKSPACE_ROUTE_NAME),
  );
  /** ID da filial (`branches/:id`) quando estamos no workspace da filial. */
  const companyBranchWorkspaceId = computed(() => {
    if (!isCompanyBranchWorkspace.value) return 0;
    const id = Number(route.params.id ?? 0);
    return Number.isFinite(id) && id > 0 ? id : 0;
  });
  return { isCompanyBranchWorkspace, companyBranchWorkspaceId };
}
