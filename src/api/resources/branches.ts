/**
 * Recurso API: filiais.
 * list, getById, create, update, delete, plucks.
 */

import http from "@/helpers/http-client";
import type { ApiPaginated, ApiResponse, BranchRecord, BranchScheduleRuleRecord } from "@/types/api";

const base = "/branches";

export interface BranchesListParams {
  page?: number;
  per_page?: number;
  search?: string;
  name?: string;
  cnpj?: string;
  company_id?: number;
  company_ids?: number[];
  created_at_from?: string;
  created_at_until?: string;
  order_by?: string;
  order_dir?: "asc" | "desc";
}

export interface BranchCreatePayload {
  company_id: number;
  name: string;
  cnpj: string;
  street: string;
  street_number: string;
  neighborhood: string;
  zip_code: string;
  city: string;
  state: string;
}

export interface BranchUpdatePayload {
  company_id?: number;
  name?: string;
  cnpj?: string;
  street?: string;
  street_number?: string;
  neighborhood?: string;
  zip_code?: string;
  city?: string;
  state?: string;
  expedient_start_time?: string;
  expedient_end_time?: string;
  store_open_time?: string;
  store_close_time?: string;
  schedule_rules?: BranchScheduleRulePayloadItem[];
}

export interface BranchSetupSubmitPayload {
  schedule_rules: BranchScheduleRulePayloadItem[];
  sector_name: string;
  employee: {
    name: string;
    email: string;
    job_title: string;
    password: string;
    password_confirmation: string;
  };
}

/** Payload de regras de horário (PUT filial). Espelha o validador Laravel. */
export type BranchScheduleRulePayloadItem = Pick<
  BranchScheduleRuleRecord,
  | "weekdays"
  | "is_closed"
  | "expedient_start_time"
  | "expedient_end_time"
  | "store_open_time"
  | "store_close_time"
  | "break_duration_minutes"
  | "daily_work_minutes"
  | "sort_order"
>;

export async function list(params?: BranchesListParams) {
  const res = await http.post<ApiResponse & { branches: ApiPaginated<BranchRecord> }>(base, params ?? {});
  return res.data;
}

export async function getById(id: number | string) {
  const res = await http.get<ApiResponse & { branch: BranchRecord }>(`${base}/${id}`);
  return res.data;
}

export async function create(payload: BranchCreatePayload) {
  const res = await http.post<ApiResponse & { branch: BranchRecord }>(`${base}/create`, payload);
  return res.data;
}

export async function update(id: number | string, payload: BranchUpdatePayload) {
  const res = await http.put<ApiResponse & { branch: BranchRecord }>(`${base}/${id}`, payload);
  return res.data;
}

/** Logo no object storage: `company/.../branches/{id}/branding/...` */
export async function uploadLogo(id: number | string, file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await http.post<ApiResponse & { branch: BranchRecord }>(`${base}/${id}/logo`, fd);
  return res.data;
}

export async function remove(id: number | string) {
  const res = await http.delete<ApiResponse>(`${base}/${id}`);
  return res.data;
}

export async function completeSetup(id: number | string) {
  const res = await http.post<ApiResponse & { branch: { id: number; setup_completed_at: string | null } }>(
    `${base}/${id}/complete-setup`,
    {}
  );
  return res.data;
}

export async function submitSetup(id: number | string, payload: BranchSetupSubmitPayload) {
  const res = await http.post<ApiResponse & { branch: { id: number; setup_completed_at: string | null } }>(
    `${base}/${id}/submit-setup`,
    payload
  );
  return res.data;
}

export async function plucks() {
  const res = await http.get<ApiResponse & { plucks: { id: number; name?: string; company_id?: number }[] }>(
    `${base}/plucks`
  );
  return res.data.plucks ?? [];
}
