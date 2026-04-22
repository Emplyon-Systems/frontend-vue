/**
 * Exemplo padrão para módulos de API.
 *
 * Como usar:
 * 1) Copie este arquivo para o recurso desejado.
 * 2) Ajuste `base`, payloads e tipos de retorno.
 * 3) Mantenha o padrão de retornar `res.data`.
 */

import http from "@/helpers/http-client";
import type { ApiResponse } from "@/types/api";

const base = "/example";

export interface ExampleListParams {
  page?: number;
  per_page?: number;
  search?: string;
}

export interface ExampleRecord {
  id: number;
  name: string;
}

export interface ExamplePluck {
  id: number;
  name: string;
}

export interface ExampleCreatePayload {
  name: string;
}

export interface ExampleUpdatePayload {
  name?: string;
}

export async function list(params?: ExampleListParams) {
  const res = await http.post<ApiResponse & { items: ExampleRecord[] }>(base, params ?? {});
  return res.data;
}

export async function getById(id: number | string) {
  const res = await http.get<ApiResponse & { item: ExampleRecord }>(`${base}/${id}`);
  return res.data;
}

export async function create(payload: ExampleCreatePayload) {
  const res = await http.post<ApiResponse & { item: ExampleRecord }>(`${base}/create`, payload);
  return res.data;
}

export async function update(id: number | string, payload: ExampleUpdatePayload) {
  const res = await http.put<ApiResponse & { item: ExampleRecord }>(`${base}/${id}`, payload);
  return res.data;
}

export async function remove(id: number | string) {
  const res = await http.delete<ApiResponse>(`${base}/${id}`);
  return res.data;
}

/**
 * Fonte padrão para opções de select.
 * Sempre retornar array simples com `id` e `name`.
 */
export async function plucks() {
  const res = await http.get<ApiResponse & { plucks: ExamplePluck[] }>(`${base}/plucks`);
  return res.data.plucks ?? [];
}
