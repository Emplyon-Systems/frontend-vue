/**
 * Recurso API: tipos de escala.
 * list, getById, create, update, delete, plucks.
 * Slug é gerado no backend a partir do nome (não enviar no front).
 */

import http from "@/helpers/http-client";
import type { ApiPaginated, ApiResponse, ScaleTypeRecord } from "@/types/api";

const base = "/scale-types";

export interface ScaleTypesListParams {
  page?: number;
  per_page?: number;
  search?: string;
  name?: string;
  branch_id?: number;
  branch_ids?: number[];
  created_at_from?: string;
  created_at_until?: string;
  order_by?: string;
  order_dir?: "asc" | "desc";
}

export interface ScaleTypeCreatePayload {
  branch_id: number;
  name: string;
}

export interface ScaleTypeUpdatePayload {
  branch_id?: number;
  name?: string;
}

export async function list(params?: ScaleTypesListParams) {
  const res = await http.post<ApiResponse & { scaleTypes: ApiPaginated<ScaleTypeRecord> }>(base, params ?? {});
  return res.data;
}

export async function getById(id: number | string) {
  const res = await http.get<ApiResponse & { scaleType: ScaleTypeRecord }>(`${base}/${id}`);
  return res.data;
}

export async function create(payload: ScaleTypeCreatePayload) {
  const res = await http.post<ApiResponse & { scaleType: ScaleTypeRecord }>(`${base}/create`, payload);
  return res.data;
}

export async function update(id: number | string, payload: ScaleTypeUpdatePayload) {
  const res = await http.put<ApiResponse & { scaleType: ScaleTypeRecord }>(`${base}/${id}`, payload);
  return res.data;
}

export async function remove(id: number | string) {
  const res = await http.delete<ApiResponse>(`${base}/${id}`);
  return res.data;
}

export interface ScaleTypesPlucksParams {
  branch_id?: number;
  branch_ids?: number[];
}

export interface ScaleTypePluckItem {
  id: number;
  branch_id: number;
  branch_name?: string;
  company_name?: string;
  name: string;
  slug: string;
}

export async function plucks(params?: ScaleTypesPlucksParams): Promise<ScaleTypePluckItem[]> {
  const res = await http.get<ApiResponse & { plucks: ScaleTypePluckItem[] }>(`${base}/plucks`, {
    params: params ?? {},
  });
  return res.data.plucks ?? [];
}
