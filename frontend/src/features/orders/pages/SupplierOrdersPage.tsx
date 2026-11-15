import { getApiErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { completeSupplierOrder, listSupplierOrders } from "../api/supplier-orders.api";
import { CompleteOrderDialog } from "../components/CompleteOrderDialog";
import { OrderStatusBadge } from "../components/OrderStatusBadge";
import type { OrderStatus, SupplierOrder, SupplierOrdersResponse } from "../types/supplier-order.types";

const PAGE_SIZE = 10;
const money = (amount: string) => `$${Number(amount).toFixed(2)}`;

export default function SupplierOrdersPage() {
  const [result, setResult] = useState<SupplierOrdersResponse | null>(null);
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [completeTarget, setCompleteTarget] = useState<SupplierOrder | null>(null);

  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(null);
    listSupplierOrders({ page, limit: PAGE_SIZE, sort: "newest", ...(status === "all" ? {} : { status }) }, controller.signal)
      .then((response) => { if (!controller.signal.aborted) setResult(response); })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(getApiErrorMessage(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, status, reload]);

  const completeOrder = async () => {
    if (!completeTarget) return;
    const updated = await completeSupplierOrder(completeTarget.id);
    setResult((current) => current ? { ...current, data: current.data.map((order) => order.id === updated.id ? updated : order) } : current);
    setCompleteTarget(null); setSuccess(`Order #${updated.id} was marked completed.`);
    if (status === "pending") setReload((value) => value + 1);
  };
  const first = result?.total ? (result.page - 1) * result.limit + 1 : 0;
  const last = result ? Math.min(result.page * result.limit, result.total) : 0;

  return <>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Supplier dashboard</p><h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Orders</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Orders placed for products supplied by your account.</p></div><label className="w-full sm:w-52"><span className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Filter by status</span><select aria-label="Filter orders by status" className="h-11 w-full rounded-[10px] border border-gray-300 bg-white px-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" value={status} onChange={(event) => { setStatus(event.target.value as "all" | OrderStatus); setPage(1); setSuccess(null); }}><option value="all">All orders</option><option value="pending">Pending</option><option value="completed">Completed</option></select></label></div>
    {success && <p role="status" className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-500/10 dark:text-green-400">{success}</p>}
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]"><div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800"><h2 className="font-medium text-gray-800 dark:text-white/90">Supplier orders</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{loading ? "Loading orders…" : `${result?.total ?? 0} order${result?.total === 1 ? "" : "s"}`}</p></div>
      {error ? <div className="px-6 py-14 text-center"><p role="alert" className="text-sm text-red-600">{error}</p><Button className="mt-4" variant="outline" onClick={() => { setLoading(true); setReload((value) => value + 1); }}>Try again</Button></div>
        : loading ? <div className="space-y-3 p-6" aria-label="Loading supplier orders">{[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />)}</div>
        : result?.data.length ? <><div className="overflow-x-auto"><Table><TableHeader><TableRow className="border-b border-gray-100 dark:border-gray-800"><TableCell isHeader className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wide text-gray-500">Order</TableCell><TableCell isHeader className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wide text-gray-500">Buyer</TableCell><TableCell isHeader className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wide text-gray-500">Items</TableCell><TableCell isHeader className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wide text-gray-500">Total</TableCell><TableCell isHeader className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wide text-gray-500">Status</TableCell><TableCell isHeader className="px-5 py-3 text-end text-xs font-medium uppercase tracking-wide text-gray-500">Action</TableCell></TableRow></TableHeader><TableBody>{result.data.map((order) => <TableRow key={order.id} className="border-b border-gray-100 last:border-0 dark:border-gray-800"><TableCell className="whitespace-nowrap px-5 py-4"><Link className="font-medium text-gray-800 hover:text-brand-500 dark:text-white/90" to={`/dashboard/supplier/orders/${order.id}`}>#{order.id}</Link><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{new Date(order.createdAt).toLocaleString()}</p></TableCell><TableCell className="px-5 py-4"><p className="text-sm font-medium text-gray-800 dark:text-white/90">{order.buyer.name}</p><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{order.buyer.email}</p></TableCell><TableCell className="min-w-52 px-5 py-4 text-sm text-gray-600 dark:text-gray-300"><ul className="space-y-1">{order.items.map((item) => <li key={`${item.productId}-${item.productName}`} className="flex justify-between gap-3"><span className="truncate">{item.productName} × {item.quantity}</span><span className="whitespace-nowrap text-gray-500">{money(item.subtotal)}</span></li>)}</ul></TableCell><TableCell className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">{money(order.totalAmount)}</TableCell><TableCell className="px-5 py-4"><OrderStatusBadge status={order.status} /></TableCell><TableCell className="px-5 py-4 text-end"><div className="inline-flex gap-2"><Button size="sm" variant="outline" nativeButton={false} render={<Link to={`/dashboard/supplier/orders/${order.id}`} />}>Details</Button>{order.status === "pending" && <Button size="sm" onClick={() => setCompleteTarget(order)}>Complete</Button>}</div></TableCell></TableRow>)}</TableBody></Table></div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 dark:border-gray-800"><p className="text-sm text-gray-500 dark:text-gray-400">Showing {first}–{last} of {result.total}</p><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><span className="text-sm text-gray-500">Page {result.page} of {Math.max(1, result.totalPages)}</span><Button variant="outline" size="sm" disabled={page >= result.totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button></div></div></>
        : <div className="px-6 py-14 text-center text-sm text-gray-600 dark:text-gray-300">{status === "all" ? "No supplier orders yet." : `No ${status} orders.`}</div>}</section>
    <CompleteOrderDialog order={completeTarget} onOpenChange={(open) => { if (!open) setCompleteTarget(null); }} onConfirm={completeOrder} />
  </>;
}
