import { getApiErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { productImageUrl, listMyProducts } from "@/features/products/api/products.api";
import type { Product } from "@/features/products/types/product.types";
import { listSupplierOrders } from "@/features/orders/api/supplier-orders.api";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import type { SupplierOrder } from "@/features/orders/types/supplier-order.types";
import { BoxIcon, CartIcon, CheckCircleIcon, ClockIcon, ListIcon } from "@/icons";
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router";

interface DashboardData {
  activeProducts: number;
  inactiveProducts: number;
  pendingOrders: number;
  completedOrders: number;
  recentProducts: Product[];
  recentOrders: SupplierOrder[];
}

const money = (amount: string) => `$${Number(amount).toFixed(2)}`;
const asRecent = <T extends { id: number; createdAt: string }>(...groups: T[][]) =>
  [...new Map(groups.flat().map((item) => [item.id, item])).values()]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

async function fetchDashboard(signal: AbortSignal): Promise<DashboardData> {
  const [active, inactive, pending, completed] = await Promise.all([
    listMyProducts({ page: 1, limit: 100, isActive: true, sortBy: "createdAt", sortOrder: "DESC" }, signal),
    listMyProducts({ page: 1, limit: 100, isActive: false, sortBy: "createdAt", sortOrder: "DESC" }, signal),
    listSupplierOrders({ page: 1, limit: 100, status: "pending", sort: "newest" }, signal),
    listSupplierOrders({ page: 1, limit: 100, status: "completed", sort: "newest" }, signal),
  ]);
  return {
    activeProducts: active.total,
    inactiveProducts: inactive.total,
    pendingOrders: pending.total,
    completedOrders: completed.total,
    recentProducts: asRecent(active.data, inactive.data),
    recentOrders: asRecent(pending.data, completed.data),
  };
}

function StatCard({ title, value, icon, tone }: { title: string; value: number; icon: ReactNode; tone: string }) {
  return <Card className="gap-4"><div className="flex items-center justify-between"><div className={`flex size-11 items-center justify-center rounded-xl ${tone}`}>{icon}</div><span className="text-xs font-medium uppercase tracking-wide text-gray-400">All time</span></div><div><p className="text-sm text-gray-500 dark:text-gray-400">{title}</p><p className="mt-1 text-2xl font-semibold text-gray-800 dark:text-white/90">{value.toLocaleString()}</p></div></Card>;
}

function LoadingCard() {
  return <div className="h-32 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800" />;
}

export default function SupplierDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const refresh = useCallback(() => { setLoading(true); setError(null); setReload((value) => value + 1); }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(null);
    fetchDashboard(controller.signal)
      .then((dashboard) => { if (!controller.signal.aborted) setData(dashboard); })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(getApiErrorMessage(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [reload]);

  const stats = data ? [
    { title: "Total products", value: data.activeProducts + data.inactiveProducts, icon: <BoxIcon className="size-5" />, tone: "bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400" },
    { title: "Active products", value: data.activeProducts, icon: <CheckCircleIcon className="size-5" />, tone: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400" },
    { title: "Inactive products", value: data.inactiveProducts, icon: <BoxIcon className="size-5" />, tone: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" },
    { title: "Total orders", value: data.pendingOrders + data.completedOrders, icon: <CartIcon className="size-5" />, tone: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400" },
    { title: "Pending orders", value: data.pendingOrders, icon: <ClockIcon className="size-5" />, tone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" },
    { title: "Completed orders", value: data.completedOrders, icon: <CheckCircleIcon className="size-5" />, tone: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400" },
  ] : [];

  return <>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Supplier workspace</p><h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Dashboard overview</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">A current snapshot of your products and orders.</p></div><div className="flex gap-2"><Button variant="outline" nativeButton={false} render={<Link to="/dashboard/supplier/orders" />}><ListIcon className="me-2 size-4" />View orders</Button><Button nativeButton={false} render={<Link to="/dashboard/supplier/products/new" />}><BoxIcon className="me-2 size-4" />Add product</Button></div></div>
    {error && <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/30 dark:bg-red-500/10"><p role="alert" className="text-sm text-red-700 dark:text-red-300">Unable to load dashboard data: {error}</p><Button size="sm" variant="outline" onClick={refresh}>Try again</Button></div>}
    <section aria-label="Supplier statistics" className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{loading && !data ? Array.from({ length: 6 }, (_, index) => <LoadingCard key={index} />) : stats.map((stat) => <StatCard key={stat.title} {...stat} />)}</section>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card className="gap-0"><CardHeader className="flex-row items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800"><div><CardTitle>Recent orders</CardTitle><CardDescription>Newest orders placed with your supplier account.</CardDescription></div><Button size="sm" variant="outline" nativeButton={false} render={<Link to="/dashboard/supplier/orders" />}>View all</Button></CardHeader><CardContent className="pt-2">{loading && !data ? <div className="space-y-4 py-4">{[1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />)}</div> : data?.recentOrders.length ? <ul className="divide-y divide-gray-100 dark:divide-gray-800">{data.recentOrders.map((order) => <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div className="min-w-0"><Link className="font-medium text-gray-800 hover:text-brand-500 dark:text-white/90" to={`/dashboard/supplier/orders/${order.id}`}>Order #{order.id}</Link><p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">{order.buyer.name} · {order.items.length} item{order.items.length === 1 ? "" : "s"} · {new Date(order.createdAt).toLocaleDateString()}</p></div><div className="flex items-center gap-3"><span className="text-sm font-medium text-gray-800 dark:text-white/90">{money(order.totalAmount)}</span><OrderStatusBadge status={order.status} /></div></li>)}</ul> : <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">No orders yet.</p>}</CardContent></Card>
      <Card className="gap-0"><CardHeader className="flex-row items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800"><div><CardTitle>Recently added products</CardTitle><CardDescription>Your latest catalog additions.</CardDescription></div><Button size="sm" variant="outline" nativeButton={false} render={<Link to="/dashboard/supplier/products" />}>View all</Button></CardHeader><CardContent className="pt-2">{loading && !data ? <div className="space-y-4 py-4">{[1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />)}</div> : data?.recentProducts.length ? <ul className="divide-y divide-gray-100 dark:divide-gray-800">{data.recentProducts.map((product) => <li key={product.id} className="flex items-center justify-between gap-3 py-4"><div className="flex min-w-0 items-center gap-3">{product.imageUrl ? <img src={productImageUrl(product.imageUrl) ?? undefined} alt="" className="size-11 shrink-0 rounded-lg object-cover" /> : <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-800"><BoxIcon className="size-5" /></span>}<div className="min-w-0"><Link className="block truncate font-medium text-gray-800 hover:text-brand-500 dark:text-white/90" to={`/dashboard/supplier/products/${product.id}`}>{product.name}</Link><p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">{product.category.name} · {new Date(product.createdAt).toLocaleDateString()}</p></div></div><div className="shrink-0 text-right"><p className="text-sm font-medium text-gray-800 dark:text-white/90">{money(product.price)}</p><p className={`mt-1 text-xs ${product.isActive ? "text-green-600 dark:text-green-400" : "text-gray-500"}`}>{product.isActive ? "Active" : "Inactive"}</p></div></li>)}</ul> : <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">No products yet. Add your first product to get started.</p>}</CardContent></Card>
    </div>
  </>;
}
