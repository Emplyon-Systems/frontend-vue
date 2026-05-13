import { computed } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";

/**
 * Centraliza detecção de escopo/painel por rota e contexto ativo.
 * Reuso típico: páginas de listagem/CRUD em owner/company/branch.
 */
export function usePanelScope() {
  const route = useRoute();
  const authStore = useAuthStore();

  const routeName = computed(() => String(route.name ?? ""));
  const isOwnerWorkspace = computed(() => routeName.value.startsWith("owner.company.workspace"));
  const isCompanyScoped = computed(() => routeName.value.startsWith("company."));
  const isBranchScoped = computed(() => routeName.value.startsWith("branch."));
  const isCompanyBranchWorkspace = computed(
    () => routeName.value.startsWith("company.branch.") || routeName.value.startsWith("owner.branch.")
  );

  const workspaceCompanyId = computed(() => {
    if (!isOwnerWorkspace.value) return 0;
    const id = Number(route.params.id ?? 0);
    return Number.isFinite(id) && id > 0 ? id : 0;
  });

  const companyBranchWorkspaceId = computed(() => {
    if (!isCompanyBranchWorkspace.value) return 0;
    const id = Number(route.params.id ?? 0);
    return Number.isFinite(id) && id > 0 ? id : 0;
  });

  const scopedCompanyId = computed(() => {
    if (!isCompanyScoped.value) return 0;
    const active = Number(authStore.activeContext?.company_id ?? 0);
    if (active > 0) return active;
    const fallback = Number(authStore.user?.companies?.[0]?.id ?? 0);
    return Number.isFinite(fallback) && fallback > 0 ? fallback : 0;
  });

  const currentBranchId = computed(() => {
    if (!isBranchScoped.value) return 0;
    const fromContext = Number(authStore.activeContext?.branch_id ?? 0);
    if (fromContext > 0) return fromContext;
    const fallback = Number(authStore.user?.branches?.[0]?.id ?? 0);
    return Number.isFinite(fallback) && fallback > 0 ? fallback : 0;
  });

  const isCompanyFixed = computed(() => isOwnerWorkspace.value || isCompanyScoped.value);
  const effectiveCompanyId = computed(() =>
    isOwnerWorkspace.value ? workspaceCompanyId.value : scopedCompanyId.value
  );

  return {
    routeName,
    isOwnerWorkspace,
    isCompanyScoped,
    isBranchScoped,
    isCompanyBranchWorkspace,
    workspaceCompanyId,
    companyBranchWorkspaceId,
    scopedCompanyId,
    currentBranchId,
    isCompanyFixed,
    effectiveCompanyId,
  };
}
