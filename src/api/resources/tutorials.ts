/**
 * Tutoriais (catálogo global + públicos-alvo).
 */

import http from "@/helpers/http-client";
import type { ApiPaginated, ApiResponse, TutorialRecord } from "@/types/api";

const base = "/tutorials";

export type TutorialTargetCode = "branch" | "employee" | "company" | "all";

export interface TutorialsListParams {
  page?: number;
  per_page?: number;
  search?: string;
  title?: string;
  tutorial_category_id?: number;
  target?: TutorialTargetCode;
  created_at_from?: string;
  created_at_until?: string;
  order_by?: string;
  order_dir?: "asc" | "desc";
}

export interface TutorialCreatePayload {
  tutorial_category_id: number;
  title: string;
  url: string;
  thumbnail: string;
  targets: TutorialTargetCode[];
}

export interface TutorialUpdatePayload {
  tutorial_category_id?: number;
  title?: string;
  url?: string;
  thumbnail?: string;
  targets?: TutorialTargetCode[];
}

export async function list(params?: TutorialsListParams) {
  const res = await http.post<ApiResponse & { tutorials: ApiPaginated<TutorialRecord> }>(base, params ?? {});
  return res.data;
}

export async function getById(id: number | string) {
  const res = await http.get<ApiResponse & { tutorial: TutorialRecord }>(`${base}/${id}`);
  return res.data;
}

export async function create(payload: TutorialCreatePayload) {
  const res = await http.post<ApiResponse & { tutorial: TutorialRecord }>(`${base}/create`, payload);
  return res.data;
}

export async function update(id: number | string, payload: TutorialUpdatePayload) {
  const res = await http.put<ApiResponse & { tutorial: TutorialRecord }>(`${base}/${id}`, payload);
  return res.data;
}

export async function remove(id: number | string) {
  const res = await http.delete<ApiResponse>(`${base}/${id}`);
  return res.data;
}

/** Grava thumbnail em `storage/app/public/tutorials/thumbnails` e devolve URL absoluta. */
export async function uploadThumbnail(file: File, replaceThumbnailUrl?: string | null) {
  const fd = new FormData();
  fd.append("file", file);
  if (replaceThumbnailUrl) {
    fd.append("replace_thumbnail_url", replaceThumbnailUrl);
  }
  const res = await http.post<ApiResponse & { thumbnail_url: string }>(`${base}/thumbnail`, fd);
  return res.data;
}

export interface TutorialPluckItem {
  id: number;
  title: string;
}

export async function plucks(params?: { search?: string; tutorial_category_id?: number }): Promise<TutorialPluckItem[]> {
  const res = await http.get<ApiResponse & { plucks: TutorialPluckItem[] }>(`${base}/plucks`, {
    params: params ?? {},
  });
  return res.data.plucks ?? [];
}
