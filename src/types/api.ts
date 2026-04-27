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
  /** Funcionário vinculado ao usuário nesta filial (listagem com filtro por filial). */
  employee?: { id: number; user_id?: number; name?: string } | null;
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

/** Template de perfil automático (ex.: ao criar filial). */
export interface RoleTemplateRecord {
  id: number;
  key: string;
  name: string;
  description?: string | null;
  provision_scope: string;
  auto_provision: boolean;
  slug_prefix: string;
  sort_order: number;
  is_locked: boolean;
  /** Se false, não entra no provisionamento automático (linha mantida na BD). */
  is_active: boolean;
  /** Se true (escopo empresa), o usuário criado com a empresa recebe este perfil. */
  assigns_company_owner?: boolean;
  permissions?: RolePermission[];
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
  /** MinIO/S3 — logo institucional. */
  logo_disk?: string | null;
  logo_path?: string | null;
  logo_url?: string | null;
  /** Domínio sintético para e-mail de colaboradores (slug do nome + .com). */
  internal_email_domain?: string;
  /** Primeiros passos da empresa (filial + gerente) concluídos. */
  setup_completed_at?: string | null;
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
    logo_url?: string | null;
    pivot?: { is_primary?: boolean };
  }>;
}

/** 1=segunda … 7=domingo (ISO). */
export interface BranchScheduleRuleRecord {
  id: number;
  branch_id?: number;
  weekdays: number[];
  is_closed: boolean;
  expedient_start_time?: string | null;
  expedient_end_time?: string | null;
  store_open_time?: string | null;
  store_close_time?: string | null;
  break_duration_minutes?: number | null;
  daily_work_minutes?: number | null;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
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
  setup_completed_at?: string | null;
  schedule_rules?: BranchScheduleRuleRecord[];
  users_used?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  logo_disk?: string | null;
  logo_path?: string | null;
  logo_url?: string | null;
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

export interface EmployeeBranchPivot {
  sector_id: number;
  is_primary?: boolean;
  modality_type_id?: number | null;
}

export interface EmployeeRecord {
  id: number;
  company_id: number;
  user_id?: number | null;
  name: string;
  cpf?: string | null;
  email: string;
  phone?: string | null;
  position_id?: number | null;
  position?: {
    id: number;
    name: string;
    slug?: string;
    branch_id?: number;
  } | null;
  street?: string | null;
  street_number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  zip_code?: string | null;
  city?: string | null;
  state?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  photo_disk?: string | null;
  photo_path?: string | null;
  photo_url?: string | null;
  company?: {
    id: number;
    name?: string;
    internal_email_domain?: string;
  } | null;
  user?: {
    id: number;
    name: string;
    email: string;
  } | null;
  branches?: Array<{
    id: number;
    name?: string;
    company_id?: number;
    pivot?: EmployeeBranchPivot;
    pivot_sector?: {
      id: number;
      branch_id?: number;
      name: string;
      slug?: string;
    } | null;
    pivot_modality_type?: {
      id: number;
      branch_id?: number;
      name: string;
      slug: string;
    } | null;
  }>;
}

export interface SectorRecord {
  id: number;
  branch_id: number;
  name: string;
  slug: string;
  start_time?: string;
  end_time?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  branch?: {
    id: number;
    name?: string;
    company_id?: number;
  } | null;
}

export interface PositionRecord {
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

export interface DayOffModalityRecord {
  id: number;
  branch_id: number;
  name: string;
  slug: string;
  description?: string | null;
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

export interface EmployeeVacationRecord {
  id: number;
  employee_id: number;
  start_date: string;
  end_date: string;
  total_period_days: number;
  created_at?: string;
  updated_at?: string;
  employee?: { id: number; name?: string; company_id?: number } | null;
}

export interface EmployeeMedicalCertificateRecord {
  id: number;
  employee_id: number;
  start_date: string;
  end_date: string;
  total_period_days: number;
  created_at?: string;
  updated_at?: string;
  employee?: { id: number; name?: string; company_id?: number } | null;
}

export interface EmployeeLeafRecord {
  id: number;
  employee_id: number;
  start_date: string;
  end_date: string;
  total_period_days: number;
  created_at?: string;
  updated_at?: string;
  employee?: { id: number; name?: string; company_id?: number } | null;
}

export interface EmployeeLeaveRequestRecord {
  id: number;
  employee_id: number;
  requested_by_user_id: number;
  request_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  reviewed_by_user_id?: number | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
  created_at?: string;
  updated_at?: string;
  employee?: { id: number; name?: string; company_id?: number } | null;
  requested_by_user?: { id: number; name?: string; email?: string } | null;
  reviewed_by_user?: { id: number; name?: string; email?: string } | null;
}

export interface EmployeeDayOffRecord {
  id: number;
  employee_id: number;
  employee_leave_request_id: number;
  day_off_date: string;
  approved_by_user_id?: number | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  employee?: { id: number; name?: string; company_id?: number } | null;
  leave_request?: { id: number; request_date?: string; status?: string } | null;
  approved_by_user?: { id: number; name?: string; email?: string } | null;
}
