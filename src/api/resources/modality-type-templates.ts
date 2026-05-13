/**
 * API: templates globais de modalidade (pacotes modelo).
 */

import http from "@/helpers/http-client";
import type { ApiPaginated, ApiResponse, ModalityTypeTemplateRecord } from "@/types/api";

const base = "/modality-type-templates";

export async function list(params?: Record<string, unknown>) {
  const res = await http.post<ApiResponse & { modalityTypeTemplates: ApiPaginated<ModalityTypeTemplateRecord> }>(
    base,
    params ?? {},
  );
  return res.data;
}

export async function getById(id: number | string) {
  const res = await http.get<ApiResponse & { modalityTypeTemplate: ModalityTypeTemplateRecord }>(`${base}/${id}`);
  return res.data;
}

export interface ModalityTypeTemplateCreatePayload {
  name: string;
  description?: string | null;
  /** Opcional — o servidor pode gerar única a partir do nome. */
  key?: string | null;
  provision_scope: "branch" | "company";
  auto_provision?: boolean;
  sort_order?: number;
  is_active?: boolean;
  is_default?: boolean;
}

export interface ModalityTypeTemplateUpdatePayload {
  name?: string;
  description?: string | null;
  key?: string | null;
  provision_scope?: "branch" | "company";
  auto_provision?: boolean;
  sort_order?: number;
  is_active?: boolean;
  is_default?: boolean;
}

export async function create(payload: ModalityTypeTemplateCreatePayload) {
  const res = await http.post<ApiResponse & { modalityTypeTemplate: ModalityTypeTemplateRecord }>(
    `${base}/create`,
    payload,
  );
  return res.data;
}

export async function update(id: number | string, payload: ModalityTypeTemplateUpdatePayload) {
  const res = await http.put<ApiResponse & { modalityTypeTemplate: ModalityTypeTemplateRecord }>(
    `${base}/${id}`,
    payload,
  );
  return res.data;
}

export async function remove(id: number | string) {
  const res = await http.delete<ApiResponse>(`${base}/${id}`);
  return res.data;
}
