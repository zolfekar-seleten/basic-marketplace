import AppLayout from "@/components/layout/app-layout";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import MarketplaceHome from "@/pages/marketplace/MarketplaceHome";
import EcommercePage from "@/pages/main/dashboard/ecommerce";
import { Error404Page } from "@/pages/main/pages";
import { Route, Routes } from "react-router";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MarketplaceLayout />}>
        <Route index element={<MarketplaceHome />} />
      </Route>

      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<EcommercePage />} />
      </Route>

      <Route path="*" element={<Error404Page />} />
    </Routes>
  );
}
