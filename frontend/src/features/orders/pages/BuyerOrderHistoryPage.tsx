import { getApiErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { listBuyerOrders } from "@/features/orders/api/buyer-orders.api";
import type { BuyerOrderListResponse, BuyerOrderStatus } from "@/features/orders/types/buyer-order.types";
import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import { OrderStatusBadge } from "../components/OrderStatusBadge";
import "./buyer-order-history.css";

const PAGE_SIZE = 10;

function readPage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function formatMoney(value: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value));
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function BuyerOrderHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const page = readPage(searchParams.get("page"));
  const statusValue = searchParams.get("status");
  const status: BuyerOrderStatus | undefined = statusValue === "pending" || statusValue === "completed" ? statusValue : undefined;
  const [result, setResult] = useState<BuyerOrderListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    listBuyerOrders({ page, limit: PAGE_SIZE, ...(status ? { status } : {}), sort: "newest" }, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setResult(data); })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(getApiErrorMessage(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, status, retry]);

  useEffect(() => {
    if (result && result.totalPages > 0 && page > result.totalPages) {
      setSearchParams((current) => { const next = new URLSearchParams(current); next.set("page", String(result.totalPages)); return next; }, { replace: true });
    }
  }, [page, result, setSearchParams]);

  const setFilter = (nextStatus: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("page");
      if (nextStatus === "all") next.delete("status");
      else next.set("status", nextStatus);
      return next;
    });
  };
  const first = result?.total ? (result.page - 1) * result.limit + 1 : 0;
  const last = result ? Math.min(result.page * result.limit, result.total) : 0;
  const pageCount = Math.max(1, result?.totalPages ?? 1);

  return <div className="buyer-orders-page">
    <header className="buyer-orders-heading"><div><p className="buyer-orders-eyebrow">YOUR MARKETPLACE</p><h1>Order history</h1><p>Every supplier order is tracked separately, even when placed in one checkout.</p></div><Link to="/products">Continue shopping <span aria-hidden="true">↗</span></Link></header>
    <div className="buyer-orders-toolbar"><div><h2>Your orders</h2><p>{loading ? "Loading order history…" : `${(result?.total ?? 0).toLocaleString()} order${result?.total === 1 ? "" : "s"}`}</p></div><label>Status <select aria-label="Filter orders by status" value={status ?? "all"} onChange={(event) => setFilter(event.target.value)}><option value="all">All orders</option><option value="pending">Pending</option><option value="completed">Completed</option></select></label></div>
    {error ? <section className="buyer-orders-message buyer-orders-error"><h2>Orders couldn’t be loaded</h2><p role="alert">{error}</p><Button onClick={() => setRetry((value) => value + 1)}>Try again</Button></section>
      : loading && !result ? <section className="buyer-order-list" aria-label="Loading orders" aria-busy="true">{[1, 2, 3].map((key) => <div className="buyer-order-skeleton" key={key}><span /><div><i /><i /><i /></div></div>)}</section>
      : result?.data.length ? <><section className="buyer-order-list" aria-label="Order history">{result.data.map((order) => {
        const units = order.items.reduce((count, item) => count + item.quantity, 0);
        return <article className="buyer-order-card" key={order.id}><div className="buyer-order-card-main"><div className="buyer-order-card-title"><div><p>Order reference</p><h3>#{order.id}</h3></div><OrderStatusBadge status={order.status} /></div><div className="buyer-order-card-meta"><div><span>Date</span><strong>{formatDate(order.createdAt)}</strong></div><div><span>Supplier</span><strong>{order.supplier.name}</strong></div><div><span>Products</span><strong>{order.items.length} products · {units} units</strong></div></div></div><div className="buyer-order-card-total"><span>Order total</span><strong>{formatMoney(order.totalAmount)}</strong><Link to={`/my-orders/${order.id}`} state={{ from: `${location.pathname}${location.search}` }}>View order details</Link></div></article>;
      })}</section><footer className="buyer-orders-pagination"><span>Showing {first}–{last} of {result.total} orders</span><div><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setSearchParams((current) => { const next = new URLSearchParams(current); next.set("page", String(page - 1)); return next; })}>Previous</Button><span>Page {result.page} of {pageCount}</span><Button variant="outline" size="sm" disabled={page >= result.totalPages} onClick={() => setSearchParams((current) => { const next = new URLSearchParams(current); next.set("page", String(page + 1)); return next; })}>Next</Button></div></footer></>
      : <section className="buyer-orders-message"><span aria-hidden="true">W</span><h2>{status ? `No ${status} orders` : "No orders yet"}</h2><p>{status ? "Try another status filter or view all orders." : "Your supplier orders will appear here after checkout."}</p>{status ? <Button variant="outline" onClick={() => setFilter("all")}>View all orders</Button> : <Button nativeButton={false} render={<Link to="/products" />}>Browse products</Button>}</section>}
  </div>;
}
