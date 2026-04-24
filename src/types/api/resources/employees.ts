import type { ApiPaginated, ApiResponse, DateRangeParams, OrderParams, SearchParams } from "@/types/api/common";
import type { EmployeeRecord } from "@/types/api";

export interface EmployeesListParams extends SearchParams, DateRangeParams, OrderParams {
  page?: number;
  per_page?: number;
  company_id?: number;
  company_ids?: number[];
  branch_id?: number;
  branch_ids?: number[];
}

export interface EmployeeAssignmentInput {
  branch_id: number;
  sector_id: number;
  is_primary?: boolean;
}

export interface EmployeeCreatePayload {
  company_id: number;
  user_id?: number | null;
  name: string;
  cpf?: string | null;
  email: string;
  phone?: string | null;
  position_id?: number | null;
  street?: string | null;
  street_number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  zip_code?: string | null;
  city?: string | null;
  state?: string | null;
  assignments: EmployeeAssignmentInput[];
}

export type EmployeeUpdatePayload = Partial<Omit<EmployeeCreatePayload, "company_id">> & {
  company_id?: number;
  user_id?: number | null;
  assignments?: EmployeeAssignmentInput[];
};

export interface EmployeesPlucksParams {
  company_id?: number;
  company_ids?: number[];
  branch_ids?: number[];
}

export interface EmployeePluckItem {
  id: number;
  name: string;
  email: string;
  company_id: number;
}

export type EmployeesListResponse = ApiResponse & { employees: ApiPaginated<EmployeeRecord> };
export type EmployeeGetResponse = ApiResponse & { employee: EmployeeRecord };
export type EmployeeCreateResponse = ApiResponse & { employee: EmployeeRecord };
export type EmployeeUpdateResponse = ApiResponse & { employee: EmployeeRecord };
export type EmployeeRemoveResponse = ApiResponse;
export type EmployeesPlucksResponse = ApiResponse & { plucks: EmployeePluckItem[] };
