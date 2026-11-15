const TOKEN_STORAGE_KEY = "watermelon-market.access-token";

export function getAccessToken(): string | null {
  return typeof window === "undefined"
    ? null
    : window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAccessToken(token: string): void {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAccessToken(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}
