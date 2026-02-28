/**
 * Recurso API: utilizadores.
 * list, getById, create, update, delete, plucks.
 */

import http from "@/helpers/http-client";
import type { ApiPaginated, ApiResponse, UserRecord } from "@/types/api";

const base = "/users";

export interface UsersListParams {
  page?: number;
  per_page?: number;
  search?: string;
}

export interface UserCreatePayload {
  name: string;
  email: string;
  password: string;
  roles?: number[];
}

export interface UserUpdatePayload {
  name?: string;
  email?: string;
  password?: string;
  roles?: number[];
}

export async function list(params?: UsersListParams) {
  const res = await http.post<ApiResponse & { users: ApiPaginated<UserRecord> }>(base, params ?? {});
  return res.data;
}

export async function getById(id: number | string) {
  const res = await http.get<ApiResponse & { user: UserRecord }>(`${base}/${id}`);
  return res.data;
}

export async function create(payload: UserCreatePayload) {
  const res = await http.post<ApiResponse & { user: UserRecord }>(`${base}/create`, payload);
  return res.data;
}

export async function update(id: number | string, payload: UserUpdatePayload) {
  const res = await http.put<ApiResponse & { user: UserRecord }>(`${base}/${id}`, payload);
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
