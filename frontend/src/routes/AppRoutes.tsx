import AppLayout from "@/components/layout/app-layout";
import {
  PublicOnlyRoute,
  RequireRoles,
} from "@/features/auth/components/AuthRoute";
import { useAuth } from "@/features/auth/hooks/useAuth";
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import RoutePlaceholder from "@/features/auth/pages/RoutePlaceholder";
import SuppliersPage from "@/features/suppliers/pages/SuppliersPage";
import CreateSupplierPage from "@/features/suppliers/pages/CreateSupplierPage";
import SupplierDetailsPage from "@/features/suppliers/pages/SupplierDetailsPage";
import PermissionsPage from "@/features/permissions/pages/PermissionsPage";
import CreatePermissionPage from "@/features/permissions/pages/CreatePermissionPage";
import PermissionDetailsPage from "@/features/permissions/pages/PermissionDetailsPage";
import RolesPage from "@/features/roles/pages/RolesPage";
import RoleDetailsPage from "@/features/roles/pages/RoleDetailsPage";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import MarketplaceHome from "@/pages/marketplace/MarketplaceHome";
import EcommercePage from "@/pages/main/dashboard/ecommerce";
import { Error404Page } from "@/pages/main/pages";
import { Navigate, Route, Routes, useLocation } from "react-router";

function DashboardEntry() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role.name === "admin") return <Navigate to="/dashboard/admin" replace />;
  if (user.role.name === "supplier") return <Navigate to="/dashboard/supplier" replace />;
  return <Navigate to="/" replace />;
}

function PublicProductPlaceholder() {
  const { pathname } = useLocation();
  return <RoutePlaceholder title={pathname === "/products" ? "Products" : "Product details"} />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MarketplaceLayout />}>
        <Route index element={<MarketplaceHome />} />
        <Route element={<PublicOnlyRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>
        <Route path="products" element={<PublicProductPlaceholder />} />
        <Route path="products/:id" element={<PublicProductPlaceholder />} />
      </Route>

      <Route element={<RequireRoles roles={["buyer"]} />}>
        <Route path="cart" element={<RoutePlaceholder title="Shopping cart" />} />
        <Route path="checkout" element={<RoutePlaceholder title="Checkout" />} />
        <Route path="my-orders" element={<RoutePlaceholder title="My orders" />} />
      </Route>

      <Route element={<RequireRoles roles={["admin", "supplier"]} />}>
        <Route path="dashboard" element={<DashboardEntry />} />
      </Route>

      <Route path="dashboard/admin" element={<RequireRoles roles={["admin"]} />}>
        <Route element={<AppLayout />}>
          <Route index element={<EcommercePage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="suppliers/new" element={<CreateSupplierPage />} />
          <Route path="suppliers/:id" element={<SupplierDetailsPage />} />
          <Route path="permissions" element={<PermissionsPage />} />
          <Route path="permissions/new" element={<CreatePermissionPage />} />
          <Route path="permissions/:id" element={<PermissionDetailsPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="roles/:id" element={<RoleDetailsPage />} />
          <Route path="*" element={<RoutePlaceholder title="Admin dashboard" />} />
        </Route>
      </Route>

      <Route path="dashboard/supplier" element={<RequireRoles roles={["supplier"]} />}>
        <Route element={<AppLayout />}>
          <Route index element={<RoutePlaceholder title="Supplier dashboard" />} />
          <Route path="*" element={<RoutePlaceholder title="Supplier dashboard" />} />
        </Route>
      </Route>

      <Route path="*" element={<Error404Page />} />
    </Routes>
  );
}
