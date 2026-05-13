/**
 * Template padrão para recursos de API.
 *
 * Como usar:
 * 1) Copie este arquivo para `src/api/resources/<modulo>.ts`.
 * 2) Ajuste `base` e os nomes de retorno (`item/items`).
 * 3) Reexporte os tipos para manter compatibilidade de imports.
 */

import http from "@/helpers/http-client";
import type {
  ExampleCreatePayload,
  ExampleCreateResponse,
  ExampleGetResponse,
  ExamplesListParams,
  ExamplesListResponse,
  ExamplesPlucksResponse,
  ExampleRemoveResponse,
  ExampleUpdatePayload,
  ExampleUpdateResponse,
} from "@/types/api/resources/example";

const base = "/example";

export type {
  ExamplesListParams,
  ExampleCreatePayload,
  ExampleUpdatePayload,
  ExamplePluck,
  ExamplesListResponse,
  ExampleGetResponse,
  ExampleCreateResponse,
  ExampleUpdateResponse,
  ExampleRemoveResponse,
  ExamplesPlucksResponse,
} from "@/types/api/resources/example";

export async function list(params?: ExamplesListParams) {
  const res = await http.post<ExamplesListResponse>(base, params ?? {});
  return res.data;
}

export async function getById(id: number | string) {
  const res = await http.get<ExampleGetResponse>(`${base}/${id}`);
  return res.data;
}

export async function create(payload: ExampleCreatePayload) {
  const res = await http.post<ExampleCreateResponse>(`${base}/create`, payload);
  return res.data;
}

export async function update(id: number | string, payload: ExampleUpdatePayload) {
  const res = await http.put<ExampleUpdateResponse>(`${base}/${id}`, payload);
  return res.data;
}

export async function remove(id: number | string) {
  const res = await http.delete<ExampleRemoveResponse>(`${base}/${id}`);
  return res.data;
}

export async function plucks() {
  const res = await http.get<ExamplesPlucksResponse>(`${base}/plucks`);
  return res.data.plucks ?? [];
}
