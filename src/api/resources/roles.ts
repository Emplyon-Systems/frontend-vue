/**
 * Recurso API: roles (perfis).
 * list, getById, create, update, delete, syncPermissions.
 * Para selects usa list com per_page alto e mapeia para opções.
 */

import http from "@/helpers/http-client";
import type { ApiPaginated, ApiResponse, RoleRecord } from "@/types/api";

const base = "/roles";

export interface RolesListParams {
  page?: number;
  per_page?: number;
  search?: string;
  company_id?: number;
  company_ids?: number[];
  branch_id?: number;
  branch_ids?: number[];
  created_at_from?: string;
  created_at_until?: string;
  order_by?: string;
  order_dir?: "asc" | "desc";
}

export interface RoleCreatePayload {
  name: string;
  description?: string;
  permissions?: number[];
}

export interface RoleUpdatePayload {
  name?: string;
  description?: string;
  permissions?: number[];
}

export async function list(params?: RolesListParams) {
  const res = await http.post<ApiResponse & { roles: ApiPaginated<RoleRecord> }>(base, params ?? {});
  return res.data;
}

export async function getById(id: number | string) {
  const res = await http.get<ApiResponse & { role: RoleRecord }>(`${base}/${id}`);
  return res.data;
}

export async function create(payload: RoleCreatePayload) {
  const res = await http.post<ApiResponse & { role: RoleRecord }>(`${base}/create`, payload);
  return res.data;
}

export async function update(id: number | string, payload: RoleUpdatePayload) {
  const res = await http.put<ApiResponse & { role: RoleRecord }>(`${base}/${id}`, payload);
  return res.data;
}

export async function remove(id: number | string) {
  const res = await http.delete<ApiResponse>(`${base}/${id}`);
  return res.data;
}

export async function syncPermissions(id: number | string, permissionIds: number[]) {
  const res = await http.post<ApiResponse & { role: RoleRecord }>(`${base}/${id}/permissions`, {
    permissions: permissionIds,
  });
  return res.data;
}

/**
 * Plucks – lista reduzida para multiselects (chama GET /roles/plucks).
 * Padrão: backend expõe plucks; front usa em formulários.
 */
export async function plucks(params?: { company_id?: number; company_ids?: number[]; branch_id?: number; branch_ids?: number[] }): Promise<{ id: number; name: string; slug: string; branch_id?: number | null; branch_name?: string | null }[]> {
  const res = await http.get<ApiResponse & { plucks: { id: number; name: string; slug: string; branch_id?: number | null; branch_name?: string | null }[] }>(`${base}/plucks`, {
    params: params ?? {},
  });
  return res.data.plucks ?? [];
}
