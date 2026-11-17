import axios from "axios";
import { getApiErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { getBuyerOrder } from "@/features/orders/api/buyer-orders.api";
import type { BuyerOrder } from "@/features/orders/types/buyer-order.types";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { OrderStatusBadge } from "../components/OrderStatusBadge";
import "./buyer-order-history.css";

type OrderDetailsState =
  | { status: "loading" }
  | { status: "loaded"; order: BuyerOrder }
  | { status: "not-found" }
  | { status: "error"; message: string };

function money(value: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value));
}

export default function BuyerOrderDetailsPage() {
  const { id: rawId } = useParams();
  const location = useLocation();
  const id = Number(rawId);
  const validId = Number.isInteger(id) && id > 0;
  const [state, setState] = useState<OrderDetailsState>({ status: "loading" });
  const [retry, setRetry] = useState(0);
  const backTo = typeof location.state?.from === "string" && location.state.from.startsWith("/my-orders") ? location.state.from : "/my-orders";

  useEffect(() => {
    if (!validId) {
      setState({ status: "not-found" });
      return;
    }
    const controller = new AbortController();
    setState({ status: "loading" });
    getBuyerOrder(id, controller.signal)
      .then((order) => { if (!controller.signal.aborted) setState({ status: "loaded", order }); })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        if (axios.isAxiosError(reason) && reason.response?.status === 404) setState({ status: "not-found" });
        else setState({ status: "error", message: getApiErrorMessage(reason) });
      });
    return () => controller.abort();
  }, [id, validId, retry]);

  return <div className="buyer-orders-page">
    <Link className="buyer-order-back" to={backTo}>← Back to order history</Link>
    {state.status === "loading" ? <section className="buyer-orders-message" aria-label="Loading order" aria-busy="true"><div className="buyer-order-detail-skeleton" /></section>
      : state.status === "not-found" ? <section className="buyer-orders-message"><span aria-hidden="true">?</span><h1>Order not found</h1><p>This order may not exist or may not belong to your account.</p><Button nativeButton={false} render={<Link to="/my-orders" />}>View order history</Button></section>
      : state.status === "error" ? <section className="buyer-orders-message buyer-orders-error"><h1>Order details couldn’t be loaded</h1><p role="alert">{state.message}</p><Button onClick={() => setRetry((value) => value + 1)}>Try again</Button></section>
      : <OrderDetails order={state.order} />}
  </div>;
}

function OrderDetails({ order }: { order: BuyerOrder }) {
  const quantity = order.items.reduce((count, item) => count + item.quantity, 0);
  return <article className="buyer-order-details-card"><header className="buyer-order-details-heading"><div><p className="buyer-orders-eyebrow">ORDER DETAILS</p><h1>Order #{order.id}</h1><p>Placed {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.createdAt))}</p></div><OrderStatusBadge status={order.status} /></header>
    <section className="buyer-order-supplier"><span>Supplier</span><strong>{order.supplier.name}</strong></section>
    <section className="buyer-order-detail-items" aria-label="Products in this supplier order">{order.items.map((item) => <article className="buyer-order-detail-item" key={`${item.productId}-${item.productName}`}><div><h2>{item.productName}</h2><p>{money(item.unitPrice)} each · Quantity {item.quantity}</p></div><strong>{money(item.subtotal)}</strong></article>)}</section>
    <footer className="buyer-order-details-total"><span>{order.items.length} products · {quantity} units</span><div><span>Order total</span><strong>{money(order.totalAmount)}</strong></div></footer>
  </article>;
}
