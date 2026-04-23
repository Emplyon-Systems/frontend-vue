import http from "@/helpers/http-client";
import type { ApiPaginated, ApiResponse, EmployeeLeaveRequestRecord } from "@/types/api";

const base = "/employee-leave-requests";

export interface EmployeeLeaveRequestsListParams {
  page?: number;
  per_page?: number;
  employee_id?: number;
  company_id?: number;
  branch_id?: number;
  requested_by_user_id?: number;
  status?: "pending" | "approved" | "rejected" | "cancelled";
  /** Vários estados (ex.: aprovação + rejeição para o painel de notificações do colaborador). */
  statuses?: Array<"pending" | "approved" | "rejected" | "cancelled">;
  request_date_from?: string;
  request_date_until?: string;
  created_at_from?: string;
  created_at_until?: string;
  order_by?: string;
  order_dir?: "asc" | "desc";
}

export interface EmployeeLeaveRequestPayload {
  employee_id: number;
  requested_by_user_id?: number;
  request_date: string;
  reason: string;
  status?: "pending" | "approved" | "rejected" | "cancelled";
  reviewed_by_user_id?: number | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
}

export async function list(params?: EmployeeLeaveRequestsListParams) {
  const res = await http.post<ApiResponse & { employeeLeaveRequests: ApiPaginated<EmployeeLeaveRequestRecord> }>(
    base,
    params ?? {}
  );
  return res.data;
}

export async function getById(id: number | string) {
  const res = await http.get<ApiResponse & { employeeLeaveRequest: EmployeeLeaveRequestRecord }>(`${base}/${id}`);
  return res.data;
}

export async function create(payload: EmployeeLeaveRequestPayload) {
  const res = await http.post<ApiResponse & { employeeLeaveRequest: EmployeeLeaveRequestRecord }>(`${base}/create`, payload);
  return res.data;
}

export async function update(id: number | string, payload: Partial<EmployeeLeaveRequestPayload>) {
  const res = await http.put<ApiResponse & { employeeLeaveRequest: EmployeeLeaveRequestRecord }>(
    `${base}/${id}`,
    payload
  );
  return res.data;
}

