/**
 * Recurso API: usuários.
 * list, getById, create, update, delete, plucks.
 */

import http from "@/helpers/http-client";
import type { ApiPaginated, ApiResponse, UserRecord } from "@/types/api";

const base = "/users";

export interface UsersListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: "active" | "inactive";
  created_at_from?: string;
  created_at_until?: string;
  role_id?: number;
  company_id?: number;
  company_ids?: number[];
  branch_id?: number;
  branch_ids?: number[];
  sector_ids?: number[];
  /** Só utilizadores sem registo de funcionário (ou ver `except_employee_user_id`) */
  without_employee?: boolean | number;
  /** Incluir este utilizador na lista mesmo já tendo funcionário (ex.: edição do próprio vínculo) */
  except_employee_user_id?: number;
  order_by?: string;
  order_dir?: "asc" | "desc";
}

export interface UserCreatePayload {
  name: string;
  email: string;
  password: string;
  status?: "active" | "inactive";
  roles?: number[];
  company_ids?: number[];
  branch_ids?: number[];
  sector_ids?: number[];
  direct_permission_ids?: number[];
}

export interface UserUpdatePayload {
  name?: string;
  email?: string;
  password?: string;
  status?: "active" | "inactive";
  roles?: number[];
  company_ids?: number[];
  branch_ids?: number[];
  sector_ids?: number[];
  direct_permission_ids?: number[];
}

export async function list(params?: UsersListParams) {
  const res = await http.post<ApiResponse & { users: ApiPaginated<UserRecord> }>(base, params ?? {});
  return res.data;
}

export async function getById(id: number | string) {
  const res = await http.get<ApiResponse & { user: UserRecord }>(`${base}/${id}`);
  return res.data;
}

export async function create(payload: UserCreatePayload) {
  const res = await http.post<ApiResponse & { user: UserRecord }>(`${base}/create`, payload);
  return res.data;
}

export async function update(id: number | string, payload: UserUpdatePayload) {
  const res = await http.put<ApiResponse & { user: UserRecord }>(`${base}/${id}`, payload);
  return res.data;
}

export async function remove(id: number | string) {
  const res = await http.delete<ApiResponse>(`${base}/${id}`);
  return res.data;
}

export async function plucks() {
  const res = await http.get<
    ApiResponse & {
      plucks: {
        users?: { id: number; name?: string; email?: string }[];
        roles?: { id: number; name?: string; slug?: string }[];
        companies?: { id: number; name?: string; cnpj?: string }[];
        branches?: { id: number; company_id?: number; name?: string; cnpj?: string }[];
      };
    }
  >(`${base}/plucks`);
  return res.data.plucks ?? {};
}
