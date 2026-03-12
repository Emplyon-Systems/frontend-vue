/**
 * Recurso API: tipos de modalidade.
 * list, getById, create, update, delete, plucks.
 * Slug é gerado no backend a partir do nome (não enviar no front).
 */

import http from "@/helpers/http-client";
import type { ApiPaginated, ApiResponse, ModalityTypeRecord } from "@/types/api";

const base = "/modality-types";

export interface ModalityTypesListParams {
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

export interface ModalityTypeCreatePayload {
  branch_id: number;
  name: string;
  is_default?: boolean;
}

export interface ModalityTypeUpdatePayload {
  branch_id?: number;
  name?: string;
  is_default?: boolean;
}

export async function list(params?: ModalityTypesListParams) {
  const res = await http.post<ApiResponse & { modalityTypes: ApiPaginated<ModalityTypeRecord> }>(base, params ?? {});
  return res.data;
}

export async function getById(id: number | string) {
  const res = await http.get<ApiResponse & { modalityType: ModalityTypeRecord }>(`${base}/${id}`);
  return res.data;
}

export async function create(payload: ModalityTypeCreatePayload) {
  const res = await http.post<ApiResponse & { modalityType: ModalityTypeRecord }>(`${base}/create`, payload);
  return res.data;
}

export async function update(id: number | string, payload: ModalityTypeUpdatePayload) {
  const res = await http.put<ApiResponse & { modalityType: ModalityTypeRecord }>(`${base}/${id}`, payload);
  return res.data;
}

export async function remove(id: number | string) {
  const res = await http.delete<ApiResponse>(`${base}/${id}`);
  return res.data;
}

export interface ModalityTypesPlucksParams {
  branch_id?: number;
  branch_ids?: number[];
}

export interface ModalityTypePluckItem {
  id: number;
  branch_id: number;
  branch_name?: string;
  company_name?: string;
  name: string;
  slug: string;
  is_default: boolean;
}

export async function plucks(params?: ModalityTypesPlucksParams): Promise<ModalityTypePluckItem[]> {
  const res = await http.get<ApiResponse & { plucks: ModalityTypePluckItem[] }>(`${base}/plucks`, {
    params: params ?? {},
  });
  return res.data.plucks ?? [];
}
