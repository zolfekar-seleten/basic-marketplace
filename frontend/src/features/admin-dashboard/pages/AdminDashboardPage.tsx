import { getApiErrorMessage } from "@/api/client";
import { PageMeta } from "@/components/shared/page-meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts";
import { listCategories } from "@/features/categories/api/categories.api";
import type { Category } from "@/features/categories/types/category.types";
import { listProducts, productImageUrl } from "@/features/products/api/products.api";
import type { Product } from "@/features/products/types/product.types";
import { listSuppliers } from "@/features/suppliers/api/suppliers.api";
import { BoxIcon, CartIcon, CheckCircleIcon, ClockIcon, GroupIcon, TagIcon, UsersIcon } from "@/icons";
import type { ApexOptions } from "apexcharts";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import ReactApexChart from "react-apexcharts";
import { Link } from "react-router";

interface AdminDashboardData {
  totalSuppliers: number;
  activeSuppliers: number;
  totalCategories: number;
  totalProducts: number | null;
  activeProducts: number;
  categories: Category[];
  recentActiveProducts: Product[];
}

async function fetchAdminDashboard(signal: AbortSignal): Promise<AdminDashboardData> {
  const [suppliers, activeSuppliers, categories, products] = await Promise.all([
    listSuppliers({ page: 1, limit: 1 }, signal),
    listSuppliers({ page: 1, limit: 1, isActive: true }, signal),
    listCategories(signal),
    listProducts({ page: 1, limit: 5, sortBy: "createdAt", sortOrder: "DESC" }, signal),
  ]);
  const completeProductCounts = categories.every((category) => typeof category.productCount === "number");
  return {
    totalSuppliers: suppliers.total,
    activeSuppliers: activeSuppliers.total,
    totalCategories: categories.length,
    totalProducts: completeProductCounts
      ? categories.reduce((total, category) => total + (category.productCount ?? 0), 0)
      : null,
    activeProducts: products.total,
    categories,
    recentActiveProducts: products.data,
  };
}

function StatCard({ title, value, icon, note }: { title: string; value: number | null; icon: ReactNode; note?: string }) {
  return <Card className="gap-4"><div className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">{icon}</div><div><p className="text-sm text-gray-500 dark:text-gray-400">{title}</p><p className="mt-1 text-2xl font-semibold text-gray-800 dark:text-white/90">{value === null ? "—" : value.toLocaleString()}</p>{note && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{note}</p>}</div></Card>;
}

function SkeletonCard() {
  return <div className="h-32 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800" />;
}

function UnavailablePanel({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300">{children}</div>;
}

export default function AdminDashboardPage() {
  const { theme } = useTheme();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState(0);
  const retry = useCallback(() => { setLoading(true); setError(null); setRequestId((id) => id + 1); }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(null);
    fetchAdminDashboard(controller.signal)
      .then((result) => { if (!controller.signal.aborted) setData(result); })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(getApiErrorMessage(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [requestId]);

  const stats = [
    { title: "Total users", value: null, icon: <UsersIcon className="size-5" />, note: "Admin-wide users API unavailable" },
    { title: "Total suppliers", value: data?.totalSuppliers ?? null, icon: <GroupIcon className="size-5" /> },
    { title: "Total buyers", value: null, icon: <UsersIcon className="size-5" />, note: "Buyer count API unavailable" },
    { title: "Total products", value: data?.totalProducts ?? null, icon: <BoxIcon className="size-5" />, note: data?.totalProducts === null ? "Category product counts unavailable" : undefined },
    { title: "Active products", value: data?.activeProducts ?? null, icon: <CheckCircleIcon className="size-5" />, note: "Public catalog count" },
    { title: "Total categories", value: data?.totalCategories ?? null, icon: <TagIcon className="size-5" /> },
    { title: "Total orders", value: null, icon: <CartIcon className="size-5" />, note: "Admin-wide orders API unavailable" },
    { title: "Pending orders", value: null, icon: <ClockIcon className="size-5" />, note: "Admin-wide orders API unavailable" },
    { title: "Completed orders", value: null, icon: <CheckCircleIcon className="size-5" />, note: "Admin-wide orders API unavailable" },
  ];
  const categories = data?.categories ?? [];
  const hasCompleteCategoryCounts = categories.every((category) => typeof category.productCount === "number");
  const inactiveSuppliers = data ? Math.max(0, data.totalSuppliers - data.activeSuppliers) : 0;
  const axisColor = theme === "dark" ? "#9CA3AF" : "#667085";
  const categoryOptions: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "Outfit, sans-serif", foreColor: axisColor },
    colors: ["#ec187b"],
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "58%" } },
    dataLabels: { enabled: false },
    grid: { borderColor: theme === "dark" ? "#374151" : "#EAECF0", strokeDashArray: 3 },
    xaxis: { categories: categories.map((category) => category.name), min: 0, tickAmount: 4, labels: { style: { colors: axisColor } } },
    yaxis: { labels: { style: { colors: theme === "dark" ? "#D1D5DB" : "#344054" } } },
    tooltip: { theme },
  };
  const supplierOptions: ApexOptions = {
    chart: { type: "donut", fontFamily: "Outfit, sans-serif", foreColor: theme === "dark" ? "#D1D5DB" : "#344054" },
    labels: ["Active suppliers", "Inactive suppliers"],
    colors: ["#ec187b", "#f9a8d4"],
    legend: { position: "bottom", labels: { colors: theme === "dark" ? "#D1D5DB" : "#344054" } },
    dataLabels: { enabled: false },
    stroke: { colors: [theme === "dark" ? "#111827" : "#ffffff"] },
    tooltip: { theme },
    plotOptions: { pie: { donut: { size: "65%", labels: { show: true, total: { show: true, label: "Suppliers", color: theme === "dark" ? "#D1D5DB" : "#344054" } } } } },
  };

  return <>
    <PageMeta title="Admin Dashboard | Watermelon Market" description="Marketplace administration overview" />
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Watermelon Market</p><h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Admin dashboard</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Live marketplace metrics from the available admin APIs.</p></div></div>
    {error && <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/30 dark:bg-red-500/10"><p role="alert" className="text-sm text-red-700 dark:text-red-300">Unable to load dashboard metrics: {error}</p><Button size="sm" variant="outline" onClick={retry}>Retry</Button></div>}
    <section aria-label="Dashboard statistics" className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{loading && !data ? Array.from({ length: 9 }, (_, index) => <SkeletonCard key={index} />) : stats.map((stat) => <StatCard key={stat.title} {...stat} />)}</section>
    <div className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
      <Card><CardHeader><CardTitle>Products by category</CardTitle><CardDescription>Product totals come from category counts, including inactive listings.</CardDescription></CardHeader><CardContent>{loading && !data ? <div className="h-64 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" /> : !categories.length ? <UnavailablePanel>No categories are available to chart.</UnavailablePanel> : hasCompleteCategoryCounts ? <ReactApexChart options={categoryOptions} series={[{ name: "Products", data: categories.map((category) => category.productCount as number) }]} type="bar" height={Math.max(240, categories.length * 42)} /> : <UnavailablePanel>Category product counts were not returned, so this chart cannot be calculated accurately.</UnavailablePanel>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Supplier status</CardTitle><CardDescription>Current supplier accounts by active status.</CardDescription></CardHeader><CardContent>{loading && !data ? <div className="h-64 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" /> : data ? data.totalSuppliers ? <ReactApexChart options={supplierOptions} series={[data.activeSuppliers, inactiveSuppliers]} type="donut" height={280} /> : <UnavailablePanel>No supplier accounts yet.</UnavailablePanel> : <UnavailablePanel>Supplier statistics could not be loaded.</UnavailablePanel>}</CardContent></Card>
    </div>
    <section className="mb-6"><div className="mb-4"><h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Recent activity</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Latest activity available from current endpoints.</p></div><div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <Card><CardHeader><CardTitle>Recent active products</CardTitle><CardDescription>The public catalog endpoint only returns active listings.</CardDescription></CardHeader><CardContent>{loading && !data ? <div className="space-y-3">{[1, 2, 3].map((key) => <div key={key} className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />)}</div> : data?.recentActiveProducts.length ? <ul className="divide-y divide-gray-100 dark:divide-gray-800">{data.recentActiveProducts.map((product) => <li key={product.id} className="flex items-center justify-between gap-3 py-3"><div className="flex min-w-0 items-center gap-3">{product.imageUrl ? <img src={productImageUrl(product.imageUrl) ?? undefined} alt="" className="size-11 rounded-lg object-cover" /> : <span className="flex size-11 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"><BoxIcon className="size-5" /></span>}<div className="min-w-0"><p className="truncate font-medium text-gray-800 dark:text-white/90">{product.name}</p><p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">{product.category.name} · {product.supplier.name} · {new Date(product.createdAt).toLocaleDateString()}</p></div></div><span className="shrink-0 text-sm font-medium text-gray-700 dark:text-gray-300">${Number(product.price).toFixed(2)}</span></li>)}</ul> : <UnavailablePanel>No active products are currently listed.</UnavailablePanel>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Recently registered users</CardTitle><CardDescription>Admin-wide user activity</CardDescription></CardHeader><CardContent><UnavailablePanel>The backend does not expose an admin users list or recent-user endpoint.</UnavailablePanel></CardContent></Card>
      <Card><CardHeader><CardTitle>Recent orders</CardTitle><CardDescription>Latest marketplace orders</CardDescription></CardHeader><CardContent><UnavailablePanel>Current order endpoints are restricted to a buyer’s own orders or a supplier’s orders. There is no admin-wide order feed.</UnavailablePanel></CardContent></Card>
      <Card><CardHeader><CardTitle>Pending orders requiring attention</CardTitle><CardDescription>Orders awaiting supplier completion</CardDescription></CardHeader><CardContent><UnavailablePanel>Pending-order totals and lists are not available to administrators through the current API.</UnavailablePanel></CardContent></Card>
    </div></section>
    <section><div className="mb-4"><h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Quick actions</h2></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Button className="h-auto justify-start py-3" nativeButton={false} render={<Link to="/dashboard/admin/suppliers/new" />}>Create supplier</Button>
      <Button className="h-auto justify-start py-3" variant="outline" nativeButton={false} render={<Link to="/dashboard/admin/categories/new" />}>Create category</Button>
      <div><Button className="h-auto w-full justify-start py-3" variant="outline" disabled>Manage products</Button><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Admin product management is unavailable.</p></div>
      <div><Button className="h-auto w-full justify-start py-3" variant="outline" disabled>Manage orders</Button><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Admin order management is unavailable.</p></div>
      <Button className="h-auto justify-start py-3" variant="outline" nativeButton={false} render={<Link to="/dashboard/admin/permissions" />}>Manage permissions</Button>
    </div></section>
  </>;
}
