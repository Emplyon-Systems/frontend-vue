/**
 * API: templates de perfil (provisionamento por filial).
 */

import http from "@/helpers/http-client";
import type { ApiResponse, RoleTemplateRecord } from "@/types/api";

const base = "/role-templates";

export async function list() {
  const res = await http.post<ApiResponse & { role_templates: RoleTemplateRecord[] }>(base, {});
  return res.data;
}

export async function getById(id: number | string) {
  const res = await http.get<ApiResponse & { role_template: RoleTemplateRecord }>(`${base}/${id}`);
  return res.data;
}

export interface RoleTemplateUpdatePayload {
  name?: string;
  description?: string | null;
  auto_provision?: boolean;
  /** Inativar/reativar sem apagar o registro na BD. */
  is_active?: boolean;
  permissions?: number[];
}

export interface RoleTemplateCreatePayload {
  name: string;
  description?: string | null;
  provision_scope: "branch" | "company";
  /** Gerados no servidor se omitidos. */
  key?: string | null;
  slug_prefix?: string | null;
  auto_provision?: boolean;
  /** Só para escopo empresa: o dono criado com a empresa recebe este perfil. */
  assigns_company_owner?: boolean;
  /** Ordem na listagem; default no servidor (100). */
  sort_order?: number;
  permissions?: number[];
}

export async function create(payload: RoleTemplateCreatePayload) {
  const res = await http.post<ApiResponse & { role_template: RoleTemplateRecord }>(`${base}/create`, payload);
  return res.data;
}

export async function update(id: number | string, payload: RoleTemplateUpdatePayload) {
  const res = await http.put<ApiResponse & { role_template: RoleTemplateRecord }>(`${base}/${id}`, payload);
  return res.data;
}

/** Eliminação permanente na API (requer permissão `role_templates.delete`). */
export async function remove(id: number | string) {
  const res = await http.delete<ApiResponse>(`${base}/${id}`);
  return res.data;
}
