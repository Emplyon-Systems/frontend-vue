/**
 * Recurso API: empresas.
 * list, getById, create, update, delete, plucks.
 */

import http from "@/helpers/http-client";
import type { ApiResponse, CompanyRecord } from "@/types/api";
import type {
  CompanyCompleteSetupResponse,
  CompanyCreatePayload,
  CompanyCreateResponse,
  CompanyGetResponse,
  CompaniesListParams,
  CompaniesListResponse,
  CompaniesPlucksResponse,
  CompanyRemoveResponse,
  CompanyUpdatePayload,
  CompanyUpdateResponse,
} from "@/types/api/resources/companies";

const base = "/companies";

export type {
  CompaniesListParams,
  CompanyCreatePayload,
  CompanyUpdatePayload,
  CompanyPluck,
  CompaniesListResponse,
  CompanyGetResponse,
  CompanyCreateResponse,
  CompanyUpdateResponse,
  CompanyRemoveResponse,
  CompaniesPlucksResponse,
  CompanyCompleteSetupResponse,
} from "@/types/api/resources/companies";

export async function list(params?: CompaniesListParams) {
  const res = await http.post<CompaniesListResponse>(base, params ?? {});
  return res.data;
}

export async function getById(id: number | string) {
  const res = await http.get<CompanyGetResponse>(`${base}/${id}`);
  return res.data;
}

export async function create(payload: CompanyCreatePayload) {
  const res = await http.post<CompanyCreateResponse>(`${base}/create`, payload);
  return res.data;
}

export async function update(id: number | string, payload: CompanyUpdatePayload) {
  const res = await http.put<CompanyUpdateResponse>(`${base}/${id}`, payload);
  return res.data;
}

/** Logo no object storage: `company/{id}/branding/...` */
export async function uploadLogo(id: number | string, file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await http.post<ApiResponse & { company: CompanyRecord }>(`${base}/${id}/logo`, fd);
  return res.data;
}

export async function remove(id: number | string) {
  const res = await http.delete<CompanyRemoveResponse>(`${base}/${id}`);
  return res.data;
}

export async function plucks() {
  const res = await http.get<CompaniesPlucksResponse>(`${base}/plucks`);
  return res.data.plucks ?? [];
}

export async function completeSetup(id: number | string) {
  const res = await http.post<CompanyCompleteSetupResponse>(`${base}/${id}/complete-setup`, {});
  return res.data;
}
