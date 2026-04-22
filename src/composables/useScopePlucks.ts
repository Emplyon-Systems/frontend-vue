import { branchesApi, companiesApi } from "@/api/resources";
import { useAuthStore } from "@/stores/auth";

export interface ScopeOption {
  id: number;
  name: string;
  company_id?: number;
  company_name?: string;
}

interface BranchOptionsParams {
  branchScoped: boolean;
  currentBranchId: number;
  workspaceCompanyId?: number;
  companyIdFilter?: number;
  includeCompanyName?: boolean;
}

interface CompanyOptionsParams {
  companyScoped: boolean;
  scopedCompanyId: number;
  fallbackCompanyName?: string;
}

export function useScopePlucks() {
  const authStore = useAuthStore();

  async function loadBranchOptionsByScope(params: BranchOptionsParams): Promise<ScopeOption[]> {
    const {
      branchScoped,
      currentBranchId,
      workspaceCompanyId = 0,
      companyIdFilter = 0,
      includeCompanyName = false,
    } = params;

    if (branchScoped && currentBranchId > 0) {
      let branchName =
        authStore.activeContext?.branch_id === currentBranchId
          ? authStore.activeContext?.branch_name
          : authStore.user?.branches?.find((b) => b.id === currentBranchId)?.name;

      if (!branchName) {
        try {
          const res = await branchesApi.getById(currentBranchId);
          branchName = res.branch?.name ?? `Filial #${currentBranchId}`;
        } catch {
          branchName = `Filial #${currentBranchId}`;
        }
      }

      return [
        {
          id: currentBranchId,
          name: branchName ?? `Filial #${currentBranchId}`,
          company_name: includeCompanyName ? "" : undefined,
        },
      ];
    }

    const branches = await branchesApi.plucks();
    let options = (branches as ScopeOption[]).map((b) => ({
      id: b.id,
      name: b.name ?? `Filial #${b.id}`,
      company_id: b.company_id,
      company_name: includeCompanyName ? b.company_name ?? "" : undefined,
    }));

    const effectiveCompanyId = workspaceCompanyId > 0 ? workspaceCompanyId : companyIdFilter;
    if (effectiveCompanyId > 0) {
      options = options.filter((b) => b.company_id === effectiveCompanyId);
    }

    return options.sort((a, b) => a.name.localeCompare(b.name));
  }

  async function loadCompanyOptionsByScope(params: CompanyOptionsParams): Promise<ScopeOption[]> {
    const { companyScoped, scopedCompanyId, fallbackCompanyName = "Minha empresa" } = params;

    if (companyScoped && scopedCompanyId > 0) {
      const companyName = authStore.user?.companies?.[0]?.name ?? fallbackCompanyName;
      return [{ id: scopedCompanyId, name: companyName }];
    }

    const companies = await companiesApi.plucks();
    return companies
      .map((c) => ({ id: c.id, name: c.name ?? `Empresa #${c.id}` }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  return {
    loadBranchOptionsByScope,
    loadCompanyOptionsByScope,
  };
}
