import { createContext } from "react";
import type {
  AuthUser,
  LoginCredentials,
  RegisterInput,
} from "../types/auth.types";

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => void;
  refreshProfile: () => Promise<AuthUser>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
