/**
 * Categorias de tutoriais (catálogo global).
 */

import http from "@/helpers/http-client";
import type { ApiPaginated, ApiResponse, TutorialCategoryRecord } from "@/types/api";

const base = "/tutorial-categories";

export interface TutorialCategoriesListParams {
  page?: number;
  per_page?: number;
  search?: string;
  name?: string;
  slug?: string;
  created_at_from?: string;
  created_at_until?: string;
  order_by?: string;
  order_dir?: "asc" | "desc";
}

export interface TutorialCategoryCreatePayload {
  name: string;
  slug: string;
  description?: string | null;
}

export interface TutorialCategoryUpdatePayload {
  name?: string;
  slug?: string;
  description?: string | null;
}

export async function list(params?: TutorialCategoriesListParams) {
  const res = await http.post<ApiResponse & { tutorial_categories: ApiPaginated<TutorialCategoryRecord> }>(
    base,
    params ?? {}
  );
  return res.data;
}

export async function getById(id: number | string) {
  const res = await http.get<ApiResponse & { tutorial_category: TutorialCategoryRecord }>(`${base}/${id}`);
  return res.data;
}

export async function create(payload: TutorialCategoryCreatePayload) {
  const res = await http.post<ApiResponse & { tutorial_category: TutorialCategoryRecord }>(`${base}/create`, payload);
  return res.data;
}

export async function update(id: number | string, payload: TutorialCategoryUpdatePayload) {
  const res = await http.put<ApiResponse & { tutorial_category: TutorialCategoryRecord }>(`${base}/${id}`, payload);
  return res.data;
}

export async function remove(id: number | string) {
  const res = await http.delete<ApiResponse>(`${base}/${id}`);
  return res.data;
}

export interface TutorialCategoryPluckItem {
  id: number;
  name: string;
  slug: string;
}

export async function plucks(params?: { search?: string }): Promise<TutorialCategoryPluckItem[]> {
  const res = await http.get<ApiResponse & { plucks: TutorialCategoryPluckItem[] }>(`${base}/plucks`, {
    params: params ?? {},
  });
  return res.data.plucks ?? [];
}
