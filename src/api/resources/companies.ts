/**
 * Recurso API: empresas.
 * list, getById, create, update, delete, plucks.
 */

import http from "@/helpers/http-client";
import type { ApiPaginated, ApiResponse, CompanyRecord } from "@/types/api";

const base = "/companies";

export interface CompaniesListParams {
  page?: number;
  per_page?: number;
  search?: string;
  name?: string;
  cnpj?: string;
  created_at_from?: string;
  created_at_until?: string;
  order_by?: string;
  order_dir?: "asc" | "desc";
}

export interface CompanyCreatePayload {
  name: string;
  cnpj: string;
  street: string;
  street_number: string;
  neighborhood: string;
  zip_code: string;
  city: string;
  state: string;
  email: string;
  phone: string;
  branch_limit: number;
  user_limit: number;
  user_name: string;
  user_email: string;
  user_password: string;
  user_password_confirmation: string;
}

export interface CompanyUpdatePayload {
  name?: string;
  cnpj?: string;
  street?: string;
  street_number?: string;
  neighborhood?: string;
  zip_code?: string;
  city?: string;
  state?: string;
  email?: string;
  phone?: string;
  branch_limit?: number;
  user_limit?: number;
}

export async function list(params?: CompaniesListParams) {
  const res = await http.post<ApiResponse & { companies: ApiPaginated<CompanyRecord> }>(base, params ?? {});
  return res.data;
}

export async function getById(id: number | string) {
  const res = await http.get<ApiResponse & { company: CompanyRecord }>(`${base}/${id}`);
  return res.data;
}

export async function create(payload: CompanyCreatePayload) {
  const res = await http.post<ApiResponse & { company: CompanyRecord }>(`${base}/create`, payload);
  return res.data;
}

export async function update(id: number | string, payload: CompanyUpdatePayload) {
  const res = await http.put<ApiResponse & { company: CompanyRecord }>(`${base}/${id}`, payload);
  return res.data;
}

export async function remove(id: number | string) {
  const res = await http.delete<ApiResponse>(`${base}/${id}`);
  return res.data;
}

export async function plucks() {
  const res = await http.get<ApiResponse & { plucks: { id: number; name?: string }[] }>(`${base}/plucks`);
  return res.data.plucks ?? [];
}
