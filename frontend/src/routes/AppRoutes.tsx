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
import CategoriesPage from "@/features/categories/pages/CategoriesPage";
import CreateCategoryPage from "@/features/categories/pages/CreateCategoryPage";
import CategoryDetailsPage from "@/features/categories/pages/CategoryDetailsPage";
import ProductsPage from "@/features/products/pages/ProductsPage";
import CreateProductPage from "@/features/products/pages/CreateProductPage";
import ProductDetailsPage from "@/features/products/pages/ProductDetailsPage";
import SupplierOrdersPage from "@/features/orders/pages/SupplierOrdersPage";
import SupplierOrderDetailsPage from "@/features/orders/pages/SupplierOrderDetailsPage";
import SupplierDashboardPage from "@/features/supplier-dashboard/pages/SupplierDashboardPage";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import MarketplaceHome from "@/pages/marketplace/MarketplaceHome";
import AdminDashboardPage from "@/features/admin-dashboard/pages/AdminDashboardPage";
import MarketplaceProductsPage from "@/features/products/pages/MarketplaceProductsPage";
import MarketplaceProductDetailsPage from "@/features/products/pages/MarketplaceProductDetailsPage";
import CartPage from "@/features/cart/pages/CartPage";
import CheckoutPage from "@/features/orders/pages/CheckoutPage";
import BuyerOrderHistoryPage from "@/features/orders/pages/BuyerOrderHistoryPage";
import BuyerOrderDetailsPage from "@/features/orders/pages/BuyerOrderDetailsPage";
import { Error404Page } from "@/pages/main/pages";
import { Navigate, Route, Routes } from "react-router";

function DashboardEntry() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role.name === "admin") return <Navigate to="/dashboard/admin" replace />;
  if (user.role.name === "supplier") return <Navigate to="/dashboard/supplier" replace />;
  return <Navigate to="/" replace />;
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
        <Route path="products" element={<MarketplaceProductsPage />} />
        <Route path="products/:id" element={<MarketplaceProductDetailsPage />} />
        <Route element={<RequireRoles roles={["buyer"]} />}>
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="my-orders" element={<BuyerOrderHistoryPage />} />
          <Route path="my-orders/:id" element={<BuyerOrderDetailsPage />} />
        </Route>
      </Route>

      <Route element={<RequireRoles roles={["admin", "supplier"]} />}>
        <Route path="dashboard" element={<DashboardEntry />} />
      </Route>

      <Route path="dashboard/admin" element={<RequireRoles roles={["admin"]} />}>
        <Route element={<AppLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="suppliers/new" element={<CreateSupplierPage />} />
          <Route path="suppliers/:id" element={<SupplierDetailsPage />} />
          <Route path="permissions" element={<PermissionsPage />} />
          <Route path="permissions/new" element={<CreatePermissionPage />} />
          <Route path="permissions/:id" element={<PermissionDetailsPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="roles/:id" element={<RoleDetailsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="categories/new" element={<CreateCategoryPage />} />
          <Route path="categories/:id" element={<CategoryDetailsPage />} />
          <Route path="*" element={<RoutePlaceholder title="Admin dashboard" />} />
        </Route>
      </Route>

      <Route path="dashboard/supplier" element={<RequireRoles roles={["supplier"]} />}>
        <Route element={<AppLayout />}>
          <Route index element={<SupplierDashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/new" element={<CreateProductPage />} />
          <Route path="products/:id" element={<ProductDetailsPage />} />
          <Route path="orders" element={<SupplierOrdersPage />} />
          <Route path="orders/:id" element={<SupplierOrderDetailsPage />} />
          <Route path="*" element={<RoutePlaceholder title="Supplier dashboard" />} />
        </Route>
      </Route>

      <Route path="*" element={<Error404Page />} />
    </Routes>
  );
}
