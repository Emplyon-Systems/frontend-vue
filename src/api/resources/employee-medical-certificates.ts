/**
 * Recurso API: atestados médicos por funcionário.
 */

import http from "@/helpers/http-client";
import type { ApiPaginated, ApiResponse, EmployeeMedicalCertificateRecord } from "@/types/api";

const base = "/employee-medical-certificates";

export interface EmployeeMedicalCertificatesListParams {
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

export interface EmployeeMedicalCertificatePayload {
  employee_id: number;
  start_date: string;
  end_date: string;
  total_period_days?: number;
}

export async function list(params?: EmployeeMedicalCertificatesListParams) {
  const res = await http.post<
    ApiResponse & { employeeMedicalCertificates: ApiPaginated<EmployeeMedicalCertificateRecord> }
  >(base, params ?? {});
  return res.data;
}

export async function getById(id: number | string) {
  const res = await http.get<
    ApiResponse & { employeeMedicalCertificate: EmployeeMedicalCertificateRecord }
  >(`${base}/${id}`);
  return res.data;
}

export async function create(payload: EmployeeMedicalCertificatePayload) {
  const res = await http.post<
    ApiResponse & { employeeMedicalCertificate: EmployeeMedicalCertificateRecord }
  >(`${base}/create`, payload);
  return res.data;
}

export async function update(id: number | string, payload: Partial<EmployeeMedicalCertificatePayload>) {
  const res = await http.put<
    ApiResponse & { employeeMedicalCertificate: EmployeeMedicalCertificateRecord }
  >(`${base}/${id}`, payload);
  return res.data;
}

export async function remove(id: number | string) {
  const res = await http.delete<ApiResponse>(`${base}/${id}`);
  return res.data;
}
