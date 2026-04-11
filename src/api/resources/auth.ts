/**
 * Autenticação pública (sem token): recuperação de senha.
 */

import http from "@/helpers/http-client";
import type { ApiResponse } from "@/types/api";

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
};

export type VerifyResetTokenPayload = {
  email: string;
  token: string;
};

export type ForgotPasswordResponse = ApiResponse & {
  message?: string;
};

export type ResetPasswordResponse = ApiResponse & {
  message?: string;
  error_code?: string;
};

export type VerifyResetTokenResponse = ApiResponse & {
  valid?: boolean;
  error_code?: string;
};

/** POST /api/forgot-password */
export async function forgotPassword(payload: ForgotPasswordPayload) {
  const res = await http.post<ForgotPasswordResponse>("/forgot-password", payload);
  return res.data;
}

/** POST /api/reset-password */
export async function resetPassword(payload: ResetPasswordPayload) {
  const res = await http.post<ResetPasswordResponse>("/reset-password", payload);
  return res.data;
}

/** POST /api/verify-reset-token */
export async function verifyResetToken(payload: VerifyResetTokenPayload) {
  const res = await http.post<VerifyResetTokenResponse>("/verify-reset-token", payload);
  return res.data;
}
