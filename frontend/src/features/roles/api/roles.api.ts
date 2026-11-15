import { apiClient } from "@/api/client";
import type { RolePermissions, RoleSummary } from "../types/role.types";

export async function listRoles(signal?: AbortSignal): Promise<RoleSummary[]> {
  const response = await apiClient.get<RoleSummary[]>("/roles", { signal });
  return response.data;
}

export async function getRolePermissions(
  roleId: number,
  signal?: AbortSignal,
): Promise<RolePermissions> {
  const response = await apiClient.get<RolePermissions>(
    `/roles/${roleId}/permissions`,
    { signal },
  );
  return response.data;
}

export async function synchronizeRolePermissions(
  roleId: number,
  permissionIds: number[],
): Promise<RolePermissions> {
  const response = await apiClient.put<RolePermissions>(
    `/roles/${roleId}/permissions`,
    { permissionIds },
  );
  return response.data;
}
