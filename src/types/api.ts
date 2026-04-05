/**
 * Tipos para respostas da API (users, roles, permissions, audits).
 * Alinhados ao Laravel ResponseHelper e modelos.
 */

export interface ApiPaginated<T> {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

export interface ApiResponse<T = unknown> {
  action: string;
  status: number;
  msg: string;
  request?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface UserRole {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  permissions?: RolePermission[];
}

export interface UserCompany {
  id: number;
  name: string;
  cnpj?: string | null;
}

export interface UserBranch {
  id: number;
  company_id: number;
  name: string;
  cnpj?: string | null;
  company?: UserCompany | null;
}

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  status?: "active" | "inactive";
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
  roles?: UserRole[];
  permissions?: RolePermission[];
  companies?: UserCompany[];
  branches?: UserBranch[];
  sectors?: Array<{
    id: number;
    name: string;
    slug?: string;
    branch?: { id: number; name?: string } | null;
  }>;
}

export interface RolePermission {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
}

export interface RoleRecord {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  company_id?: number | null;
  branch_id?: number | null;
  company?: { id: number; name?: string } | null;
  branch?: { id: number; name?: string; company_id?: number } | null;
  permissions?: RolePermission[];
}

export interface PermissionRecord {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
}

export interface CompanyRecord {
  id: number;
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
  /** Filiais existentes (contagem). */
  branches_used?: number;
  /** Usuarios com acesso à empresa (vínculo direto ou filial). */
  users_used?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  users?: Array<{
    id: number;
    name: string;
    email: string;
    roles?: UserRole[];
    pivot?: { is_primary?: boolean };
  }>;
  branches?: Array<{
    id: number;
    company_id: number;
    name: string;
    cnpj: string;
    city: string;
    state: string;
    pivot?: { is_primary?: boolean };
  }>;
}

export interface BranchRecord {
  id: number;
  company_id: number;
  name: string;
  cnpj: string;
  street: string;
  street_number: string;
  neighborhood: string;
  zip_code: string;
  city: string;
  state: string;
  expedient_start_time?: string;
  expedient_end_time?: string;
  store_open_time?: string;
  store_close_time?: string;
  users_used?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  company?: {
    id: number;
    name: string;
    cnpj?: string | null;
  } | null;
  users?: Array<{
    id: number;
    name: string;
    email: string;
    roles?: UserRole[];
    pivot?: { is_primary?: boolean };
  }>;
  sectors?: Array<{ id: number; name: string; slug: string }>;
}

export interface SectorRecord {
  id: number;
  branch_id: number;
  name: string;
  slug: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  branch?: {
    id: number;
    name?: string;
    company_id?: number;
  } | null;
}

export interface ShiftRecord {
  id: number;
  branch_id: number;
  name: string;
  slug: string;
  start_time: string;
  end_time: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  branch?: {
    id: number;
    name?: string;
    company_id?: number;
    company?: { id: number; name?: string } | null;
  } | null;
}

export interface ModalityTypeRecord {
  id: number;
  branch_id: number;
  name: string;
  slug: string;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  branch?: {
    id: number;
    name?: string;
    company_id?: number;
    company?: { id: number; name?: string } | null;
  } | null;
}

export interface ScaleTypeRecord {
  id: number;
  branch_id: number;
  name: string;
  slug: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  branch?: {
    id: number;
    name?: string;
    company_id?: number;
    company?: { id: number; name?: string } | null;
  } | null;
}

export interface AuditRecord {
  id: number;
  user_id: number | null;
  auditable_type: string;
  auditable_id: number | null;
  event: string;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  user?: { id: number; name: string; email: string; roles?: { id: number; name: string }[] } | null;
}

export type PluckItem = { id: number; name?: string; label?: string };
