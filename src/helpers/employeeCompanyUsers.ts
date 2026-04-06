import { usersApi } from "@/api/resources";

export type LinkedUserOption = { id: number; name: string; email: string };

export type LoadUsersForCompanyOptions = {
  /** Incluir este utilizador na lista mesmo já tendo funcionário (ex.: edição do vínculo atual) */
  exceptEmployeeUserId?: number;
};

/**
 * Utilizadores da empresa ainda sem funcionário (para vínculo opcional em owner/company).
 */
export async function loadUsersForCompany(
  companyId: number,
  options?: LoadUsersForCompanyOptions
): Promise<LinkedUserOption[]> {
  if (companyId <= 0) return [];
  try {
    const exceptId = options?.exceptEmployeeUserId;
    const res = await usersApi.list({
      company_id: companyId,
      without_employee: 1,
      ...(exceptId != null && exceptId > 0 ? { except_employee_user_id: exceptId } : {}),
      per_page: 100,
      order_by: "name",
      order_dir: "asc",
    });
    return (res.users?.data ?? []).map((u) => ({
      id: u.id,
      name: (u.name ?? "").trim() || `Utilizador #${u.id}`,
      email: (u.email ?? "").trim(),
    }));
  } catch {
    return [];
  }
}

export type LoadUsersForEmployeeParams = {
  companyId: number;
  /** Se definido, só utilizadores com acesso a esta filial (`branch_users`) */
  branchId?: number;
  /** Só quem ainda não tem funcionário; incluir exceção (ex.: utilizador já ligado a este funcionário na edição) */
  exceptEmployeeUserId?: number;
};

/**
 * Utilizadores elegíveis para vincular a um funcionário: mesma empresa,
 * opcionalmente restritos à filial, sem outro vínculo a funcionário.
 */
export async function loadUsersAvailableForEmployeeLink(
  params: LoadUsersForEmployeeParams
): Promise<LinkedUserOption[]> {
  const { companyId, branchId, exceptEmployeeUserId } = params;
  if (companyId <= 0) return [];
  try {
    const res = await usersApi.list({
      company_id: companyId,
      ...(branchId != null && branchId > 0 ? { branch_id: branchId } : {}),
      without_employee: 1,
      ...(exceptEmployeeUserId != null && exceptEmployeeUserId > 0
        ? { except_employee_user_id: exceptEmployeeUserId }
        : {}),
      per_page: 100,
      order_by: "name",
      order_dir: "asc",
    });
    return (res.users?.data ?? []).map((u) => ({
      id: u.id,
      name: (u.name ?? "").trim() || `Utilizador #${u.id}`,
      email: (u.email ?? "").trim(),
    }));
  } catch {
    return [];
  }
}
