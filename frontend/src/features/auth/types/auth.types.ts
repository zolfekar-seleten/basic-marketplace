export interface UserRole {
  id: number;
  name: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  permissions?: string[];
  permissionsVersion?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
