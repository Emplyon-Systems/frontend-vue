/**
 * Tipos alinhados ao backend Laravel (User, Role, Permission).
 * Resposta da API: { action, status, msg, user?, token?, token_type? }
 */

export interface Permission {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface Role {
  id: number;
  name: string;
  slug: string;
  description?: string;
  permissions?: Permission[];
}

export interface User {
  id: number;
  email: string;
  name?: string;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
  roles?: Role[];
}

/** Resposta do login: success('login', { user, token, token_type }) */
export interface LoginResponse {
  action: string;
  status: number;
  msg: string;
  user: User;
  token: string;
  token_type: string;
}

/** Resposta do me: success('me', { user }) */
export interface MeResponse {
  action: string;
  status: number;
  msg: string;
  user: User;
}

/** Formato genérico de resposta da API (success/error) */
export interface ApiResponse<T = unknown> {
  action: string;
  status: number;
  msg: string;
  request?: Record<string, unknown>;
  [key: string]: unknown;
} & T;
