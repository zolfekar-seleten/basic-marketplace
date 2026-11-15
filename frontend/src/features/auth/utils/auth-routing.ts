export type RoleName = "admin" | "supplier" | "buyer";

export function homeForRole(roleName: string): string {
  if (roleName === "admin") return "/dashboard/admin";
  if (roleName === "supplier") return "/dashboard/supplier";
  return "/";
}
