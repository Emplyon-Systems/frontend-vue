/**
 * Recurso API: filiais.
 * list, getById, create, update, delete, plucks.
 */

import http from "@/helpers/http-client";
import type { ApiResponse, BranchHolidayRecord, BranchRecord } from "@/types/api";
import type {
  BranchCompleteSetupResponse,
  BranchCreatePayload,
  BranchCreateResponse,
  BranchesListParams,
  BranchesListResponse,
  BranchesPlucksResponse,
  BranchGetResponse,
  BranchRemoveResponse,
  BranchScheduleRulePayloadItem,
  BranchSetupSubmitPayload,
  BranchUpdatePayload,
  BranchUpdateResponse,
} from "@/types/api/resources/branches";

const base = "/branches";

export type {
  BranchesListParams,
  BranchCreatePayload,
  BranchUpdatePayload,
  BranchSetupSubmitPayload,
  BranchScheduleRulePayloadItem,
  BranchPluck,
  BranchesListResponse,
  BranchGetResponse,
  BranchCreateResponse,
  BranchUpdateResponse,
  BranchRemoveResponse,
  BranchesPlucksResponse,
  BranchCompleteSetupResponse,
} from "@/types/api/resources/branches";

export async function list(params?: BranchesListParams) {
  const res = await http.post<BranchesListResponse>(base, params ?? {});
  return res.data;
}

export async function getById(id: number | string) {
  const res = await http.get<BranchGetResponse>(`${base}/${id}`);
  return res.data;
}

export async function create(payload: BranchCreatePayload) {
  const res = await http.post<BranchCreateResponse>(`${base}/create`, payload);
  return res.data;
}

export async function update(id: number | string, payload: BranchUpdatePayload) {
  const res = await http.put<BranchUpdateResponse>(`${base}/${id}`, payload);
  return res.data;
}

/** Logo no object storage: `company/.../branches/{id}/branding/...` */
export async function uploadLogo(id: number | string, file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await http.post<ApiResponse & { branch: BranchRecord }>(`${base}/${id}/logo`, fd);
  return res.data;
}

export async function remove(id: number | string) {
  const res = await http.delete<BranchRemoveResponse>(`${base}/${id}`);
  return res.data;
}

export async function completeSetup(id: number | string) {
  const res = await http.post<BranchCompleteSetupResponse>(`${base}/${id}/complete-setup`, {});
  return res.data;
}

export async function submitSetup(id: number | string, payload: BranchSetupSubmitPayload) {
  const res = await http.post<BranchCompleteSetupResponse>(`${base}/${id}/submit-setup`, payload);
  return res.data;
}

export async function plucks() {
  const res = await http.get<BranchesPlucksResponse>(`${base}/plucks`);
  return res.data.plucks ?? [];
}

export interface BranchHolidaysResponse extends ApiResponse {
  holidays: BranchHolidayRecord[];
  year: number;
  branch_id: number;
}

export async function holidays(id: number | string, year?: number): Promise<BranchHolidaysResponse> {
  const params = year ? `?year=${year}` : "";
  const res = await http.get<BranchHolidaysResponse>(`${base}/${id}/holidays${params}`);
  return res.data;
}

export async function syncHolidays(id: number | string, year?: number): Promise<ApiResponse> {
  const res = await http.post<ApiResponse>(`${base}/${id}/sync-holidays`, year ? { year } : {});
  return res.data;
}
