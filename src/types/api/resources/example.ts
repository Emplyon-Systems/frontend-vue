import type { ApiPaginated, ApiResponse, DateRangeParams, OrderParams, SearchParams } from "@/types/api/common";

/**
 * Template de tipos para recursos da API.
 * Copie este arquivo e substitua `Example` pelo nome do domínio.
 */

export interface ExamplesListParams extends SearchParams, DateRangeParams, OrderParams {
  page?: number;
  per_page?: number;
}

export interface ExampleRecord {
  id: number;
  name: string;
}

export interface ExampleCreatePayload {
  name: string;
}

export interface ExampleUpdatePayload {
  name?: string;
}

export interface ExamplePluck {
  id: number;
  name?: string;
}

export type ExamplesListResponse = ApiResponse & { items: ApiPaginated<ExampleRecord> };
export type ExampleGetResponse = ApiResponse & { item: ExampleRecord };
export type ExampleCreateResponse = ApiResponse & { item: ExampleRecord };
export type ExampleUpdateResponse = ApiResponse & { item: ExampleRecord };
export type ExampleRemoveResponse = ApiResponse;
export type ExamplesPlucksResponse = ApiResponse & { plucks: ExamplePluck[] };
