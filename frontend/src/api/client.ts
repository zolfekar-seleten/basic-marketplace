import axios, { AxiosError } from "axios";
import { clearAccessToken, getAccessToken } from "@/features/auth/token-storage";

const apiBaseUrl = import.meta.env.VITE_API_URL?.trim();

if (!apiBaseUrl) {
  throw new Error("VITE_API_URL is required. Add it to frontend/.env.");
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl.replace(/\/$/, ""),
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const requestPath = error.config?.url?.split("?")[0];
    if (
      error.response?.status === 401 &&
      requestPath !== "/auth/login" &&
      requestPath !== "/auth/register"
    ) {
      clearAccessToken();
      window.dispatchEvent(new Event("watermelon-auth-unauthorized"));
    }
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(" ");
    if (typeof message === "string") return message;
    if (error.code === "ERR_NETWORK") {
      return "Unable to reach the server. Check your connection and try again.";
    }
  }
  return "Something went wrong. Please try again.";
}
