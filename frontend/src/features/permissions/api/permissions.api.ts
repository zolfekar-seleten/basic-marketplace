import { apiClient } from "@/api/client";
import type {
  CreatePermissionInput,
  Permission,
  UpdatePermissionInput,
} from "../types/permission.types";

export async function listPermissions(signal?: AbortSignal): Promise<Permission[]> {
  const response = await apiClient.get<Permission[]>("/permissions", { signal });
  return response.data;
}

export async function getPermission(
  id: number,
  signal?: AbortSignal,
): Promise<Permission> {
  const response = await apiClient.get<Permission>(`/permissions/${id}`, {
    signal,
  });
  return response.data;
}

export async function createPermission(
  input: CreatePermissionInput,
): Promise<Permission> {
  const response = await apiClient.post<Permission>("/permissions", input);
  return response.data;
}

export async function updatePermission(
  id: number,
  input: UpdatePermissionInput,
): Promise<Permission> {
  const response = await apiClient.patch<Permission>(
    `/permissions/${id}`,
    input,
  );
  return response.data;
}

export async function deletePermission(id: number): Promise<void> {
  await apiClient.delete(`/permissions/${id}`);
}
