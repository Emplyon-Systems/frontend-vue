/**
 * Recurso API: usuários.
 * list, getById, create, update, delete, plucks.
 */

import http from "@/helpers/http-client";
import type {
  SyntheticEmailPreviewPayload,
  SyntheticEmailPreviewResponse,
  UserCreatePayload,
  UserCreateResponse,
  UserGetResponse,
  UserRemoveResponse,
  UserUpdatePayload,
  UserUpdateResponse,
  UsersListParams,
  UsersListResponse,
  UsersPlucksResponse,
} from "@/types/api/resources/users";

const base = "/users";

export type {
  UsersListParams,
  UserCreatePayload,
  UserUpdatePayload,
  SyntheticEmailPreviewPayload,
  UsersPlucksResponse,
  UsersListResponse,
  UserGetResponse,
  UserCreateResponse,
  UserUpdateResponse,
  UserRemoveResponse,
  SyntheticEmailPreviewResponse,
} from "@/types/api/resources/users";

export async function list(params?: UsersListParams) {
  const res = await http.post<UsersListResponse>(base, params ?? {});
  return res.data;
}

export async function getById(id: number | string) {
  const res = await http.get<UserGetResponse>(`${base}/${id}`);
  return res.data;
}

export async function syntheticEmailPreview(payload: SyntheticEmailPreviewPayload) {
  const res = await http.post<SyntheticEmailPreviewResponse>(`${base}/synthetic-email-preview`, payload);
  return res.data;
}

export async function create(payload: UserCreatePayload) {
  const res = await http.post<UserCreateResponse>(`${base}/create`, payload);
  return res.data;
}

export async function update(id: number | string, payload: UserUpdatePayload) {
  const res = await http.put<UserUpdateResponse>(`${base}/${id}`, payload);
  return res.data;
}

export async function remove(id: number | string) {
  const res = await http.delete<UserRemoveResponse>(`${base}/${id}`);
  return res.data;
}

export async function plucks(): Promise<UsersPlucksResponse["plucks"]> {
  const res = await http.get<UsersPlucksResponse>(`${base}/plucks`);
  return res.data.plucks ?? {};
}
