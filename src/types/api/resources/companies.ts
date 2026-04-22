import type { ApiPaginated, ApiResponse, DateRangeParams, OrderParams, SearchParams } from "@/types/api/common";
import type { CompanyRecord } from "@/types/api";

export interface CompaniesListParams extends SearchParams, DateRangeParams, OrderParams {
  page?: number;
  per_page?: number;
  name?: string;
  cnpj?: string;
}

export interface CompanyCreatePayload {
  name: string;
  cnpj: string;
  street: string;
  street_number: string;
  neighborhood: string;
  zip_code: string;
  city: string;
  state: string;
  email: string;
  phone: string;
  branch_limit: number;
  user_limit: number;
  user_name: string;
  user_email: string;
  user_password: string;
  user_password_confirmation: string;
}

export interface CompanyUpdatePayload {
  name?: string;
  cnpj?: string;
  street?: string;
  street_number?: string;
  neighborhood?: string;
  zip_code?: string;
  city?: string;
  state?: string;
  email?: string;
  phone?: string;
  branch_limit?: number;
  user_limit?: number;
}

export interface CompanyPluck {
  id: number;
  name?: string;
  internal_email_domain?: string;
}

export type CompaniesListResponse = ApiResponse & { companies: ApiPaginated<CompanyRecord> };
export type CompanyGetResponse = ApiResponse & { company: CompanyRecord };
export type CompanyCreateResponse = ApiResponse & { company: CompanyRecord };
export type CompanyUpdateResponse = ApiResponse & { company: CompanyRecord };
export type CompanyRemoveResponse = ApiResponse;
export type CompaniesPlucksResponse = ApiResponse & { plucks: CompanyPluck[] };
export type CompanyCompleteSetupResponse = ApiResponse & {
  company: { id: number; setup_completed_at: string | null };
};
