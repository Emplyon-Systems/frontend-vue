/**
 * Recurso API: auditoria (listagem e visualização detalhada).
 */

import http from "@/helpers/http-client";
import type { ApiPaginated, ApiResponse, AuditRecord } from "@/types/api";

const base = "/audits";

export interface AuditsListParams {
  page?: number;
  per_page?: number;
  auditable_type?: string;
  auditable_types?: string[];
  event?: string;
  events?: string[];
  user_id?: number;
  company_ids?: number[];
  branch_ids?: number[];
  created_at_from?: string;
  created_at_until?: string;
  order_by?: string;
  order_dir?: "asc" | "desc";
}

export async function list(params?: AuditsListParams) {
  const res = await http.post<ApiResponse & { audits: ApiPaginated<AuditRecord> }>(base, params ?? {});
  return res.data;
}

export async function getById(id: number | string) {
  const res = await http.get<ApiResponse & { audit: AuditRecord }>(`${base}/${id}`);
  return res.data;
}
