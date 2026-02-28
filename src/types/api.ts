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
}

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
  roles?: UserRole[];
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
  permissions?: RolePermission[];
}

export interface PermissionRecord {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
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
  user?: { id: number; name: string; email: string } | null;
}

export type PluckItem = { id: number; name?: string; label?: string };
