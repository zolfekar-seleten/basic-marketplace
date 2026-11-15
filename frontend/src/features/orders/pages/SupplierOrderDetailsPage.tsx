import { getApiErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { completeSupplierOrder, getSupplierOrder } from "../api/supplier-orders.api";
import { CompleteOrderDialog } from "../components/CompleteOrderDialog";
import { OrderStatusBadge } from "../components/OrderStatusBadge";
import type { SupplierOrder } from "../types/supplier-order.types";

const money = (amount: string) => `$${Number(amount).toFixed(2)}`;

export default function SupplierOrderDetailsPage() {
  const { id: rawId = "" } = useParams();
  const id = /^\d+$/.test(rawId) ? Number(rawId) : NaN;
  const [order, setOrder] = useState<SupplierOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!Number.isSafeInteger(id) || id < 1) { setLoading(false); setError("Invalid order ID."); return; }
    const controller = new AbortController(); setLoading(true); setError(null);
    getSupplierOrder(id, controller.signal)
      .then((item) => { if (!controller.signal.aborted) setOrder(item); })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(getApiErrorMessage(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, reload]);

  const complete = async () => {
    const updated = await completeSupplierOrder(id);
    setOrder(updated); setCompleteOpen(false); setSuccess("Order marked completed.");
  };

  if (loading) return <div className="space-y-4" aria-label="Loading order details"><div className="h-8 w-64 animate-pulse rounded bg-gray-100 dark:bg-gray-800" /><div className="h-72 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" /></div>;
  if (error || !order || order.id !== id) return <section className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center dark:border-gray-800 dark:bg-white/[0.03]"><h1 className="text-lg font-semibold text-gray-800 dark:text-white/90">Unable to load order</h1><p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">{error ?? "Order not found."}</p><div className="mt-5 flex justify-center gap-3"><Button variant="outline" onClick={() => { setError(null); setLoading(true); setReload((value) => value + 1); }}>Try again</Button><Button variant="outline" nativeButton={false} render={<Link to="/dashboard/supplier/orders" />}>Back to orders</Button></div></section>;

  return <>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Supplier order details</p><h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Order #{order.id}</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Placed {new Date(order.createdAt).toLocaleString()}</p></div><div className="flex items-center gap-3"><OrderStatusBadge status={order.status} />{order.status === "pending" && <Button onClick={() => setCompleteOpen(true)}>Mark completed</Button>}</div></div>
    {success && <p role="status" className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-500/10 dark:text-green-400">{success}</p>}
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]"><div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800"><h2 className="font-medium text-gray-800 dark:text-white/90">Ordered products</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Historical names and prices from this order.</p></div><div className="overflow-x-auto"><table className="min-w-full"><thead><tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400"><th className="px-5 py-3">Product</th><th className="px-5 py-3">Unit price</th><th className="px-5 py-3">Quantity</th><th className="px-5 py-3 text-right">Subtotal</th></tr></thead><tbody>{order.items.map((item, index) => <tr key={`${item.productId}-${index}`} className="border-b border-gray-100 last:border-0 dark:border-gray-800"><td className="px-5 py-4"><p className="font-medium text-gray-800 dark:text-white/90">{item.productName}</p><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Product #{item.productId}</p></td><td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{money(item.unitPrice)}</td><td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{item.quantity}</td><td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium text-gray-800 dark:text-white/90">{money(item.subtotal)}</td></tr>)}</tbody></table></div><div className="flex justify-between border-t border-gray-100 px-5 py-4 dark:border-gray-800"><span className="font-medium text-gray-700 dark:text-gray-300">Order total</span><span className="text-lg font-semibold text-gray-900 dark:text-white">{money(order.totalAmount)}</span></div></section>
      <aside className="space-y-5"><section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]"><h2 className="font-medium text-gray-800 dark:text-white/90">Buyer</h2><dl className="mt-4 space-y-4"><div><dt className="text-xs text-gray-500 dark:text-gray-400">Name</dt><dd className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{order.buyer.name}</dd></div><div><dt className="text-xs text-gray-500 dark:text-gray-400">Email</dt><dd className="mt-1 break-all text-sm font-medium text-gray-800 dark:text-white/90">{order.buyer.email}</dd></div><div><dt className="text-xs text-gray-500 dark:text-gray-400">Buyer ID</dt><dd className="mt-1 text-sm text-gray-800 dark:text-white/90">#{order.buyer.id}</dd></div></dl></section><section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]"><h2 className="font-medium text-gray-800 dark:text-white/90">Order information</h2><dl className="mt-4 space-y-4"><div><dt className="text-xs text-gray-500 dark:text-gray-400">Status</dt><dd className="mt-2"><OrderStatusBadge status={order.status} /></dd></div><div><dt className="text-xs text-gray-500 dark:text-gray-400">Order date</dt><dd className="mt-1 text-sm text-gray-800 dark:text-white/90">{new Date(order.createdAt).toLocaleString()}</dd></div><div><dt className="text-xs text-gray-500 dark:text-gray-400">Last updated</dt><dd className="mt-1 text-sm text-gray-800 dark:text-white/90">{new Date(order.updatedAt).toLocaleString()}</dd></div></dl></section></aside>
    </div>
    <div className="mt-5"><Button variant="outline" nativeButton={false} render={<Link to="/dashboard/supplier/orders" />}>Back to orders</Button></div>
    <CompleteOrderDialog order={completeOpen ? order : null} onOpenChange={setCompleteOpen} onConfirm={complete} />
  </>;
}
