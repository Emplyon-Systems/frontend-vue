/**
 * Recurso API: funcionários.
 */

import http from "@/helpers/http-client";
import type { ApiPaginated, ApiResponse, EmployeeRecord } from "@/types/api";

const base = "/employees";

export interface EmployeesListParams {
  page?: number;
  per_page?: number;
  search?: string;
  company_id?: number;
  company_ids?: number[];
  branch_id?: number;
  branch_ids?: number[];
  created_at_from?: string;
  created_at_until?: string;
  order_by?: string;
  order_dir?: "asc" | "desc";
}

export interface EmployeeAssignmentInput {
  branch_id: number;
  sector_id: number;
  is_primary?: boolean;
}

export interface EmployeeCreatePayload {
  company_id: number;
  /** Opcional: usuário já existente na mesma empresa (`company_users`) */
  user_id?: number | null;
  name: string;
  cpf?: string | null;
  email: string;
  phone?: string | null;
  job_title: string;
  street?: string | null;
  street_number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  zip_code?: string | null;
  city?: string | null;
  state?: string | null;
  assignments: EmployeeAssignmentInput[];
}

export type EmployeeUpdatePayload = Partial<Omit<EmployeeCreatePayload, "company_id">> & {
  company_id?: number;
  /** `null` remove o vínculo */
  user_id?: number | null;
  assignments?: EmployeeAssignmentInput[];
};

export async function list(params?: EmployeesListParams) {
  const res = await http.post<ApiResponse & { employees: ApiPaginated<EmployeeRecord> }>(base, params ?? {});
  return res.data;
}

export async function getById(id: number | string) {
  const res = await http.get<ApiResponse & { employee: EmployeeRecord }>(`${base}/${id}`);
  return res.data;
}

export async function create(payload: EmployeeCreatePayload) {
  const res = await http.post<ApiResponse & { employee: EmployeeRecord }>(`${base}/create`, payload);
  return res.data;
}

export async function update(id: number | string, payload: EmployeeUpdatePayload) {
  const res = await http.put<ApiResponse & { employee: EmployeeRecord }>(`${base}/${id}`, payload);
  return res.data;
}

/** Foto no object storage: `company/.../employees/.../photo/...` */
export async function uploadPhoto(id: number | string, file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await http.post<ApiResponse & { employee: EmployeeRecord }>(`${base}/${id}/photo`, fd);
  return res.data;
}

export async function remove(id: number | string) {
  const res = await http.delete<ApiResponse>(`${base}/${id}`);
  return res.data;
}

export interface EmployeesPlucksParams {
  company_id?: number;
  company_ids?: number[];
  branch_ids?: number[];
}

export interface EmployeePluckItem {
  id: number;
  name: string;
  email: string;
  company_id: number;
}

export async function plucks(params?: EmployeesPlucksParams): Promise<EmployeePluckItem[]> {
  const res = await http.get<ApiResponse & { plucks: EmployeePluckItem[] }>(`${base}/plucks`, {
    params: params ?? {},
  });
  return res.data.plucks ?? [];
}
