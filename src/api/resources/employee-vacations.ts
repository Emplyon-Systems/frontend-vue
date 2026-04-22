/**
 * Recurso API: férias por funcionário.
 */

import http from "@/helpers/http-client";
import type { ApiPaginated, ApiResponse, EmployeeVacationRecord } from "@/types/api";

const base = "/employee-vacations";

export interface EmployeeVacationsListParams {
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

export interface EmployeeVacationPayload {
  employee_id: number;
  start_date: string;
  end_date: string;
  total_period_days: number;
}

export async function list(params?: EmployeeVacationsListParams) {
  const res = await http.post<
    ApiResponse & { employeeVacations: ApiPaginated<EmployeeVacationRecord> }
  >(base, params ?? {});
  return res.data;
}

export async function getById(id: number | string) {
  const res = await http.get<ApiResponse & { employeeVacation: EmployeeVacationRecord }>(
    `${base}/${id}`
  );
  return res.data;
}

export async function create(payload: EmployeeVacationPayload) {
  const res = await http.post<ApiResponse & { employeeVacation: EmployeeVacationRecord }>(
    `${base}/create`,
    payload
  );
  return res.data;
}

export async function update(id: number | string, payload: Partial<EmployeeVacationPayload>) {
  const res = await http.put<ApiResponse & { employeeVacation: EmployeeVacationRecord }>(
    `${base}/${id}`,
    payload
  );
  return res.data;
}

export async function remove(id: number | string) {
  const res = await http.delete<ApiResponse>(`${base}/${id}`);
  return res.data;
}
