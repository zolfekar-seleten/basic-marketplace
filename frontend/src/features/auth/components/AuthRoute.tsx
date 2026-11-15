import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { homeForRole, type RoleName } from "../utils/auth-routing";

function AuthLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-600 dark:bg-gray-950 dark:text-gray-300">
      Checking your session…
    </main>
  );
}

export function PublicOnlyRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <AuthLoading />;
  if (user) return <Navigate to={homeForRole(user.role.name)} replace />;
  return <Outlet />;
}

export function RequireRoles({ roles }: { roles: RoleName[] }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <AuthLoading />;
  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: `${location.pathname}${location.search}` }}
        replace
      />
    );
  }
  if (!roles.includes(user.role.name as RoleName)) {
    return <Navigate to={homeForRole(user.role.name)} replace />;
  }
  return <Outlet />;
}
