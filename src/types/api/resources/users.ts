import type { ApiPaginated, ApiResponse, DateRangeParams, OrderParams, SearchParams } from "@/types/api/common";
import type { UserRecord } from "@/types/api";

export interface UsersListParams extends SearchParams, DateRangeParams, OrderParams {
  page?: number;
  per_page?: number;
  status?: "active" | "inactive";
  role_id?: number;
  company_id?: number;
  company_ids?: number[];
  branch_id?: number;
  branch_ids?: number[];
  sector_ids?: number[];
  without_employee?: boolean | number;
  except_employee_user_id?: number;
}

export interface UserCreatePayload {
  name: string;
  email: string;
  password: string;
  status?: "active" | "inactive";
  roles?: number[];
  company_ids?: number[];
  branch_ids?: number[];
  sector_ids?: number[];
  direct_permission_ids?: number[];
}

export interface UserUpdatePayload {
  name?: string;
  email?: string;
  password?: string;
  status?: "active" | "inactive";
  roles?: number[];
  company_ids?: number[];
  branch_ids?: number[];
  sector_ids?: number[];
  direct_permission_ids?: number[];
}

export interface SyntheticEmailPreviewPayload {
  branch_id: number;
  sector_id?: number;
  sector_name?: string;
  role_ids?: number[];
}

export interface SyntheticEmailPreviewResponse extends ApiResponse {
  preview?: { email: string; local: string; domain: string };
}

export interface UsersPlucksResponse extends ApiResponse {
  plucks: {
    users?: { id: number; name?: string; email?: string }[];
    roles?: { id: number; name?: string; slug?: string }[];
    companies?: { id: number; name?: string; cnpj?: string; internal_email_domain?: string }[];
    branches?: { id: number; company_id?: number; name?: string; cnpj?: string }[];
  };
}

export type UsersListResponse = ApiResponse & { users: ApiPaginated<UserRecord> };
export type UserGetResponse = ApiResponse & { user: UserRecord };
export type UserCreateResponse = ApiResponse & { user: UserRecord };
export type UserUpdateResponse = ApiResponse & { user: UserRecord };
export type UserRemoveResponse = ApiResponse;
