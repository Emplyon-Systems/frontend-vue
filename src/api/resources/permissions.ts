/**
 * Recurso API: permissões.
 * list, getById, create, update, delete.
 */

import http from "@/helpers/http-client";
import type { ApiPaginated, ApiResponse, PermissionRecord } from "@/types/api";

const base = "/permissions";

export interface PermissionsListParams {
  page?: number;
  per_page?: number;
}

export interface PermissionCreatePayload {
  name: string;
  slug: string;
  description?: string;
}

export interface PermissionUpdatePayload {
  name?: string;
  slug?: string;
  description?: string;
}

export async function list(params?: PermissionsListParams) {
  const res = await http.post<ApiResponse & { permissions: ApiPaginated<PermissionRecord> }>(base, params ?? {});
  return res.data;
}

export async function getById(id: number | string) {
  const res = await http.get<ApiResponse & { permission: PermissionRecord }>(`${base}/${id}`);
  return res.data;
}

export async function create(payload: PermissionCreatePayload) {
  const res = await http.post<ApiResponse & { permission: PermissionRecord }>(`${base}/create`, payload);
  return res.data;
}

export async function update(id: number | string, payload: PermissionUpdatePayload) {
  const res = await http.put<ApiResponse & { permission: PermissionRecord }>(`${base}/${id}`, payload);
  return res.data;
}

export async function remove(id: number | string) {
  const res = await http.delete<ApiResponse>(`${base}/${id}`);
  return res.data;
}

/**
 * Plucks – lista reduzida para multiselects (chama GET /permissions/plucks).
 * Padrão: backend expõe plucks; front usa em formulários.
 */
export async function plucks(): Promise<{ id: number; name: string; slug: string }[]> {
  const res = await http.get<ApiResponse & { plucks: { id: number; name: string; slug: string }[] }>(`${base}/plucks`);
  return res.data.plucks ?? [];
}
