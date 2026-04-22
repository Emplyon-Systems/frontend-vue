/**
 * Tipos comuns da camada de API.
 * Use este arquivo como base para todos os recursos.
 */

export type SortDirection = "asc" | "desc";

export interface ApiResponse<TExtra = Record<string, unknown>> {
  action: string;
  status: number;
  msg: string;
  request?: Record<string, unknown>;
}

export interface ApiPaginated<T> {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
}

export interface DateRangeParams {
  created_at_from?: string;
  created_at_until?: string;
}

export interface OrderParams {
  order_by?: string;
  order_dir?: SortDirection;
}

export interface SearchParams {
  search?: string;
}

export interface IdNamePluck {
  id: number;
  name?: string;
}

export type PlucksResponse<TPluck = IdNamePluck> = ApiResponse & {
  plucks: TPluck[];
};
