import { useAuthStore } from "@/stores/auth";

export type TutorialTargetCode = "branch" | "employee" | "company" | "all";

/**
 * Filtra tutoriais visíveis conforme perfis tenant (empresa / filial / colaborador).
 * Superadmin e owner veem tudo na área pública também.
 */
export function useTutorialAudience() {
  const auth = useAuthStore();

  function tutorialVisibleForCurrentUser(targets: Array<{ target: string }> | undefined): boolean {
    const tset = new Set((targets ?? []).map((t) => String(t.target)));
    if (tset.has("all")) return true;
    if (auth.hasRole("superadmin") || auth.hasRole("owner")) return true;

    const slugs = (auth.user?.roles ?? []).map((r) => String(r.slug ?? ""));

    const isCompanyAudience = slugs.some(
      (s) => s.startsWith("empresa-c") || s === "admin" || s === "empresa"
    );
    const isBranchAudience = slugs.some(
      (s) => s.startsWith("filial-b") || s.startsWith("setor-b") || ["branch_manager", "branch", "filial"].includes(s)
    );
    const isEmployeeAudience = slugs.some(
      (s) => s.startsWith("colaborador-b") || s === "colaborador" || s === "employee"
    );

    if (isCompanyAudience && tset.has("company")) return true;
    if (isBranchAudience && tset.has("branch")) return true;
    if (isEmployeeAudience && tset.has("employee")) return true;

    return false;
  }

  return { tutorialVisibleForCurrentUser };
}
