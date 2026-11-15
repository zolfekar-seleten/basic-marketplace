import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchProfile, loginRequest, registerBuyer } from "../api/auth.api";
import { AuthContext, type AuthContextValue } from "./auth-context";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "../token-storage";
import type {
  AuthUser,
  LoginCredentials,
  RegisterInput,
} from "../types/auth.types";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    clearAccessToken();
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const profile = await fetchProfile();
    setUser(profile);
    return profile;
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const response = await loginRequest(credentials);
      setAccessToken(response.accessToken);
      try {
        return await refreshProfile();
      } catch (error) {
        clearAccessToken();
        setUser(null);
        throw error;
      }
    },
    [refreshProfile],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const response = await registerBuyer(input);
      setAccessToken(response.accessToken);
      setUser(response.user);
      try {
        return await refreshProfile();
      } catch (error) {
        clearAccessToken();
        setUser(null);
        throw error;
      }
    },
    [refreshProfile],
  );

  useEffect(() => {
    let active = true;
    const restore = async () => {
      if (!getAccessToken()) {
        if (active) setIsLoading(false);
        return;
      }
      try {
        await refreshProfile();
      } catch {
        clearAccessToken();
        if (active) setUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    const handleUnauthorized = () => {
      setUser(null);
      setIsLoading(false);
    };
    window.addEventListener("watermelon-auth-unauthorized", handleUnauthorized);
    void restore();
    return () => {
      active = false;
      window.removeEventListener(
        "watermelon-auth-unauthorized",
        handleUnauthorized,
      );
    };
  }, [refreshProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [user, isLoading, login, register, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
