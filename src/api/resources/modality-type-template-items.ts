/**
 * API: linhas de um pacote modelo de modalidade (slug / nome / padrão).
 */

import http from "@/helpers/http-client";
import type { ApiPaginated, ApiResponse, ModalityTypeTemplateItemRecord } from "@/types/api";

const base = "/modality-type-template-items";

export interface ModalityTypeTemplateItemsListParams {
  page?: number;
  per_page?: number;
  modality_type_template_id?: number;
  search?: string;
  is_default?: boolean;
  order_by?: string;
  order_dir?: "asc" | "desc";
}

export interface ModalityTypeTemplateItemCreatePayload {
  modality_type_template_id: number;
  slug: string;
  name: string;
  is_default?: boolean;
}

export type ModalityTypeTemplateItemUpdatePayload = Partial<
  Omit<ModalityTypeTemplateItemCreatePayload, "modality_type_template_id">
> & { modality_type_template_id?: number };

export async function list(params?: ModalityTypeTemplateItemsListParams) {
  const res = await http.post<ApiResponse & { modalityTypeTemplateItems: ApiPaginated<ModalityTypeTemplateItemRecord> }>(
    base,
    params ?? {},
  );
  return res.data;
}

export async function getById(id: number | string) {
  const res = await http.get<ApiResponse & { modalityTypeTemplateItem: ModalityTypeTemplateItemRecord }>(`${base}/${id}`);
  return res.data;
}

export async function create(payload: ModalityTypeTemplateItemCreatePayload) {
  const res = await http.post<ApiResponse & { modalityTypeTemplateItem: ModalityTypeTemplateItemRecord }>(
    `${base}/create`,
    payload,
  );
  return res.data;
}

export async function update(id: number | string, payload: ModalityTypeTemplateItemUpdatePayload) {
  const res = await http.put<ApiResponse & { modalityTypeTemplateItem: ModalityTypeTemplateItemRecord }>(
    `${base}/${id}`,
    payload,
  );
  return res.data;
}

export async function remove(id: number | string) {
  const res = await http.delete<ApiResponse>(`${base}/${id}`);
  return res.data;
}
