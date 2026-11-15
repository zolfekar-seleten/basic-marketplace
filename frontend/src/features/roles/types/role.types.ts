import type { Permission } from "@/features/permissions/types/permission.types";

export interface RoleSummary {
  id: number;
  name: string;
  description: string | null;
  permissionsVersion: number;
}

export interface RolePermissions {
  id: number;
  name: string;
  permissionsVersion: number;
  permissions: Permission[];
}
