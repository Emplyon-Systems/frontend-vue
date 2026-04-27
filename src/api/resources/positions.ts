/**
 * Recurso API: cargos (positions).
 * list, getById, create, update, delete, plucks.
 * Slug é gerado no backend a partir do nome (não enviar no front).
 */

import http from "@/helpers/http-client";
import type { ApiPaginated, ApiResponse, PositionRecord } from "@/types/api";

const base = "/positions";

export interface PositionsListParams {
  page?: number;
  per_page?: number;
  search?: string;
  name?: string;
  slug?: string;
  branch_id?: number;
  branch_ids?: number[];
  created_at_from?: string;
  created_at_until?: string;
  order_by?: string;
  order_dir?: "asc" | "desc";
}

export interface PositionCreatePayload {
  branch_id: number;
  name: string;
}

export interface PositionUpdatePayload {
  branch_id?: number;
  name?: string;
}

export async function list(params?: PositionsListParams) {
  const res = await http.post<ApiResponse & { positions: ApiPaginated<PositionRecord> }>(base, params ?? {});
  return res.data;
}

export async function getById(id: number | string) {
  const res = await http.get<ApiResponse & { position: PositionRecord }>(`${base}/${id}`);
  return res.data;
}

export async function create(payload: PositionCreatePayload) {
  const res = await http.post<ApiResponse & { position: PositionRecord }>(`${base}/create`, payload);
  return res.data;
}

export async function update(id: number | string, payload: PositionUpdatePayload) {
  const res = await http.put<ApiResponse & { position: PositionRecord }>(`${base}/${id}`, payload);
  return res.data;
}

export async function remove(id: number | string) {
  const res = await http.delete<ApiResponse>(`${base}/${id}`);
  return res.data;
}

export interface PositionsPlucksParams {
  branch_id?: number;
  branch_ids?: number[];
}

export interface PositionPluckItem {
  id: number;
  branch_id: number;
  branch_name?: string;
  name: string;
  slug: string;
}

export async function plucks(params?: PositionsPlucksParams): Promise<PositionPluckItem[]> {
  const res = await http.get<ApiResponse & { plucks: PositionPluckItem[] }>(`${base}/plucks`, {
    params: params ?? {},
  });
  return res.data.plucks ?? [];
}
