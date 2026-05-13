import http from "@/helpers/http-client";
import type { ApiPaginated, ApiResponse, DayOffModalityRecord } from "@/types/api";

const base = "/day-off-modalities";

export interface DayOffModalitiesListParams {
  page?: number;
  per_page?: number;
  search?: string;
  name?: string;
  branch_id?: number;
  branch_ids?: number[];
  is_default?: boolean;
  created_at_from?: string;
  created_at_until?: string;
  order_by?: string;
  order_dir?: "asc" | "desc";
}

export interface DayOffModalityCreatePayload {
  branch_id: number;
  name: string;
  description?: string;
  is_default?: boolean;
}

export type DayOffModalityUpdatePayload = Partial<DayOffModalityCreatePayload>;

export async function list(params?: DayOffModalitiesListParams) {
  const res = await http.post<ApiResponse & { dayOffModalities: ApiPaginated<DayOffModalityRecord> }>(base, params ?? {});
  return res.data;
}

export async function getById(id: number | string) {
  const res = await http.get<ApiResponse & { dayOffModality: DayOffModalityRecord }>(`${base}/${id}`);
  return res.data;
}

export async function create(payload: DayOffModalityCreatePayload) {
  const res = await http.post<ApiResponse & { dayOffModality: DayOffModalityRecord }>(`${base}/create`, payload);
  return res.data;
}

export async function update(id: number | string, payload: DayOffModalityUpdatePayload) {
  const res = await http.put<ApiResponse & { dayOffModality: DayOffModalityRecord }>(`${base}/${id}`, payload);
  return res.data;
}

export async function remove(id: number | string) {
  const res = await http.delete<ApiResponse>(`${base}/${id}`);
  return res.data;
}

export async function plucks(params?: { branch_id?: number; branch_ids?: number[] }) {
  const res = await http.get<ApiResponse & { plucks: DayOffModalityRecord[] }>(`${base}/plucks`, {
    params: params ?? {},
  });
  return res.data.plucks ?? [];
}
