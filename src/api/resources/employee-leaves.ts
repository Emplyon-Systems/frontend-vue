/**
 * Recurso API: afastamentos por funcionário.
 */

import http from "@/helpers/http-client";
import type { ApiPaginated, ApiResponse, EmployeeLeafRecord } from "@/types/api";

const base = "/employee-leaves";

export interface EmployeeLeavesListParams {
  page?: number;
  per_page?: number;
  employee_id?: number;
  company_id?: number;
  start_date_from?: string;
  start_date_until?: string;
  created_at_from?: string;
  created_at_until?: string;
  order_by?: string;
  order_dir?: "asc" | "desc";
}

export interface EmployeeLeafPayload {
  employee_id: number;
  start_date: string;
  end_date: string;
  total_period_days?: number;
}

export async function list(params?: EmployeeLeavesListParams) {
  const res = await http.post<ApiResponse & { employeeLeaves: ApiPaginated<EmployeeLeafRecord> }>(
    base,
    params ?? {}
  );
  return res.data;
}

export async function getById(id: number | string) {
  const res = await http.get<ApiResponse & { employeeLeaf: EmployeeLeafRecord }>(`${base}/${id}`);
  return res.data;
}

export async function create(payload: EmployeeLeafPayload) {
  const res = await http.post<ApiResponse & { employeeLeaf: EmployeeLeafRecord }>(
    `${base}/create`,
    payload
  );
  return res.data;
}

export async function update(id: number | string, payload: Partial<EmployeeLeafPayload>) {
  const res = await http.put<ApiResponse & { employeeLeaf: EmployeeLeafRecord }>(
    `${base}/${id}`,
    payload
  );
  return res.data;
}

export async function remove(id: number | string) {
  const res = await http.delete<ApiResponse>(`${base}/${id}`);
  return res.data;
}
