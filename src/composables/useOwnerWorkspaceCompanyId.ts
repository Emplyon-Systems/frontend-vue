import { computed } from "vue";
import { useRoute } from "vue-router";

/** Retorna o company_id fixo quando estamos dentro do workspace de empresa do superadmin.
 *  Rotas `owner.company.workspace.*` têm `params.id` = ID da empresa.
 */
export function useOwnerWorkspaceCompanyId() {
  const route = useRoute();
  const isOwnerWorkspace = computed(() =>
    String(route.name ?? "").startsWith("owner.company.workspace")
  );
  const workspaceCompanyId = computed(() => {
    if (!isOwnerWorkspace.value) return 0;
    const id = Number(route.params.id);
    return Number.isFinite(id) && id > 0 ? id : 0;
  });
  return { isOwnerWorkspace, workspaceCompanyId };
}
