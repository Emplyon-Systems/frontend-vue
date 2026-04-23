import http from "@/helpers/http-client";
import type { ApiPaginated, ApiResponse, EmployeeDayOffRecord } from "@/types/api";

const base = "/employee-day-offs";

export interface EmployeeDayOffsListParams {
  page?: number;
  per_page?: number;
  employee_id?: number;
  company_id?: number;
  branch_id?: number;
  day_off_date_from?: string;
  day_off_date_until?: string;
  order_by?: string;
  order_dir?: "asc" | "desc";
}

export async function list(params?: EmployeeDayOffsListParams) {
  const res = await http.post<ApiResponse & { employeeDayOffs: ApiPaginated<EmployeeDayOffRecord> }>(
    base,
    params ?? {}
  );
  return res.data;
}
