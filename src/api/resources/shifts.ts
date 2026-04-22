/**
 * Recurso API: turnos.
 * list, getById, create, update, delete, plucks.
 */

import http from "@/helpers/http-client";
import type { ApiPaginated, ApiResponse, ShiftRecord } from "@/types/api";

const base = "/shifts";

export interface ShiftsListParams {
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

export interface ShiftCreatePayload {
  branch_id: number;
  name: string;
  start_time: string;
  end_time: string;
}

export interface ShiftUpdatePayload {
  branch_id?: number;
  name?: string;
  start_time?: string;
  end_time?: string;
}

export async function list(params?: ShiftsListParams) {
  const res = await http.post<ApiResponse & { shifts: ApiPaginated<ShiftRecord> }>(base, params ?? {});
  return res.data;
}

export async function getById(id: number | string) {
  const res = await http.get<ApiResponse & { shift: ShiftRecord }>(`${base}/${id}`);
  return res.data;
}

export async function create(payload: ShiftCreatePayload) {
  const res = await http.post<ApiResponse & { shift: ShiftRecord }>(`${base}/create`, payload);
  return res.data;
}

export async function update(id: number | string, payload: ShiftUpdatePayload) {
  const res = await http.put<ApiResponse & { shift: ShiftRecord }>(`${base}/${id}`, payload);
  return res.data;
}

export async function remove(id: number | string) {
  const res = await http.delete<ApiResponse>(`${base}/${id}`);
  return res.data;
}

export interface ShiftsPlucksParams {
  branch_id?: number;
  branch_ids?: number[];
}

export interface ShiftPluckItem {
  id: number;
  branch_id: number;
  branch_name?: string;
  company_name?: string;
  name: string;
  slug: string;
  start_time: string;
  end_time: string;
}

export async function plucks(params?: ShiftsPlucksParams): Promise<ShiftPluckItem[]> {
  const res = await http.get<ApiResponse & { plucks: ShiftPluckItem[] }>(`${base}/plucks`, {
    params: params ?? {},
  });
  return res.data.plucks ?? [];
}
