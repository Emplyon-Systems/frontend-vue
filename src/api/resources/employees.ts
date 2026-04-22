/**
 * Recurso API: funcionários.
 */

import http from "@/helpers/http-client";
import type { ApiResponse, EmployeeRecord } from "@/types/api";
import type {
  EmployeeAssignmentInput,
  EmployeeCreatePayload,
  EmployeeCreateResponse,
  EmployeeGetResponse,
  EmployeePluckItem,
  EmployeeRemoveResponse,
  EmployeesListParams,
  EmployeesListResponse,
  EmployeesPlucksParams,
  EmployeesPlucksResponse,
  EmployeeUpdatePayload,
  EmployeeUpdateResponse,
} from "@/types/api/resources/employees";

const base = "/employees";

export type {
  EmployeesListParams,
  EmployeeAssignmentInput,
  EmployeeCreatePayload,
  EmployeeUpdatePayload,
  EmployeesPlucksParams,
  EmployeePluckItem,
  EmployeesListResponse,
  EmployeeGetResponse,
  EmployeeCreateResponse,
  EmployeeUpdateResponse,
  EmployeeRemoveResponse,
  EmployeesPlucksResponse,
} from "@/types/api/resources/employees";

export async function list(params?: EmployeesListParams) {
  const res = await http.post<EmployeesListResponse>(base, params ?? {});
  return res.data;
}

export async function getById(id: number | string) {
  const res = await http.get<EmployeeGetResponse>(`${base}/${id}`);
  return res.data;
}

export async function create(payload: EmployeeCreatePayload) {
  const res = await http.post<EmployeeCreateResponse>(`${base}/create`, payload);
  return res.data;
}

export async function update(id: number | string, payload: EmployeeUpdatePayload) {
  const res = await http.put<EmployeeUpdateResponse>(`${base}/${id}`, payload);
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
  const res = await http.delete<EmployeeRemoveResponse>(`${base}/${id}`);
  return res.data;
}

export async function plucks(params?: EmployeesPlucksParams): Promise<EmployeePluckItem[]> {
  const res = await http.get<EmployeesPlucksResponse>(`${base}/plucks`, {
    params: params ?? {},
  });
  return res.data.plucks ?? [];
}
