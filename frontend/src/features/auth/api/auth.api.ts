import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import type {
  AuthUser,
  LoginCredentials,
  LoginResponse,
  RegisterInput,
} from "../types/auth.types";

export async function loginRequest(
  credentials: LoginCredentials,
): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(
    API_ENDPOINTS.auth.login,
    credentials,
  );
  return response.data;
}

export async function registerBuyer(input: RegisterInput): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(
    API_ENDPOINTS.auth.register,
    input,
  );
  return response.data;
}

export async function fetchProfile(): Promise<AuthUser> {
  const response = await apiClient.get<AuthUser>(API_ENDPOINTS.auth.profile);
  return response.data;
}
