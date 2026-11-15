export interface Permission {
  id: number;
  name: string;
  description: string | null;
}

export interface CreatePermissionInput {
  name: string;
  description: string | null;
}

export interface UpdatePermissionInput {
  description: string;
}
