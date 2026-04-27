/**
 * Recurso API: setores.
 * list, getById, create, update, delete, plucks.
 * Slug é gerado no backend a partir do nome (não enviar no front).
 */

import http from "@/helpers/http-client";
import type { ApiPaginated, ApiResponse, SectorRecord } from "@/types/api";

const base = "/sectors";

export interface SectorsListParams {
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

export interface SectorCreatePayload {
  branch_id: number;
  name: string;
  start_time: string;
  end_time: string;
}

export interface SectorUpdatePayload {
  branch_id?: number;
  name?: string;
  start_time?: string;
  end_time?: string;
}

export async function list(params?: SectorsListParams) {
  const res = await http.post<ApiResponse & { sectors: ApiPaginated<SectorRecord> }>(base, params ?? {});
  return res.data;
}

export async function getById(id: number | string) {
  const res = await http.get<ApiResponse & { sector: SectorRecord }>(`${base}/${id}`);
  return res.data;
}

export async function create(payload: SectorCreatePayload) {
  const res = await http.post<ApiResponse & { sector: SectorRecord }>(`${base}/create`, payload);
  return res.data;
}

export async function update(id: number | string, payload: SectorUpdatePayload) {
  const res = await http.put<ApiResponse & { sector: SectorRecord }>(`${base}/${id}`, payload);
  return res.data;
}

export async function remove(id: number | string) {
  const res = await http.delete<ApiResponse>(`${base}/${id}`);
  return res.data;
}

export interface SectorsPlucksParams {
  branch_id?: number;
  branch_ids?: number[];
}

export interface SectorPluckItem {
  id: number;
  branch_id: number;
  branch_name?: string;
  name: string;
  slug: string;
  start_time?: string;
  end_time?: string;
}

export async function plucks(params?: SectorsPlucksParams): Promise<SectorPluckItem[]> {
  const res = await http.get<ApiResponse & { plucks: SectorPluckItem[] }>(`${base}/plucks`, {
    params: params ?? {},
  });
  return res.data.plucks ?? [];
}
