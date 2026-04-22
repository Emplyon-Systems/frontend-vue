import type { ApiPaginated, ApiResponse, DateRangeParams, OrderParams, SearchParams } from "@/types/api/common";
import type { BranchRecord, BranchScheduleRuleRecord } from "@/types/api";

export interface BranchesListParams extends SearchParams, DateRangeParams, OrderParams {
  page?: number;
  per_page?: number;
  name?: string;
  cnpj?: string;
  company_id?: number;
  company_ids?: number[];
}

export interface BranchCreatePayload {
  company_id: number;
  name: string;
  cnpj: string;
  street: string;
  street_number: string;
  neighborhood: string;
  zip_code: string;
  city: string;
  state: string;
}

export type BranchScheduleRulePayloadItem = Pick<
  BranchScheduleRuleRecord,
  | "weekdays"
  | "is_closed"
  | "expedient_start_time"
  | "expedient_end_time"
  | "store_open_time"
  | "store_close_time"
  | "break_duration_minutes"
  | "daily_work_minutes"
  | "sort_order"
>;

export interface BranchUpdatePayload {
  company_id?: number;
  name?: string;
  cnpj?: string;
  street?: string;
  street_number?: string;
  neighborhood?: string;
  zip_code?: string;
  city?: string;
  state?: string;
  expedient_start_time?: string;
  expedient_end_time?: string;
  store_open_time?: string;
  store_close_time?: string;
  schedule_rules?: BranchScheduleRulePayloadItem[];
}

export interface BranchSetupSubmitPayload {
  schedule_rules: BranchScheduleRulePayloadItem[];
  sector_name: string;
  employee: {
    name: string;
    email: string;
    job_title: string;
    password: string;
    password_confirmation: string;
  };
}

export interface BranchPluck {
  id: number;
  name?: string;
  company_id?: number;
}

export type BranchesListResponse = ApiResponse & { branches: ApiPaginated<BranchRecord> };
export type BranchGetResponse = ApiResponse & { branch: BranchRecord };
export type BranchCreateResponse = ApiResponse & { branch: BranchRecord };
export type BranchUpdateResponse = ApiResponse & { branch: BranchRecord };
export type BranchRemoveResponse = ApiResponse;
export type BranchesPlucksResponse = ApiResponse & { plucks: BranchPluck[] };
export type BranchCompleteSetupResponse = ApiResponse & {
  branch: { id: number; setup_completed_at: string | null };
};
