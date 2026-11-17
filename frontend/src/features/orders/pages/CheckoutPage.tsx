import { getApiErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart/hooks/useCart";
import type { CartItem } from "@/features/cart/types/cart.types";
import { productImageUrl } from "@/features/products/api/products.api";
import { checkout } from "@/features/orders/api/orders.api";
import type { CheckoutOrder, CheckoutResponse } from "@/features/orders/types/checkout.types";
import axios from "axios";
import { useRef, useState } from "react";
import { Link } from "react-router";
import { OrderStatusBadge } from "../components/OrderStatusBadge";
import "./checkout-page.css";

function money(value: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value));
}

function cents(value: string): bigint {
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole || "0") * 100n + BigInt(fraction.padEnd(2, "0").slice(0, 2));
}

function fromCents(value: bigint): string {
  return `${value / 100n}.${String(value % 100n).padStart(2, "0")}`;
}

function groupCartItems(items: CartItem[]) {
  const groups = new Map<number, { id: number; name: string; items: CartItem[] }>();
  for (const item of items) {
    const supplier = item.product.supplier;
    const group = groups.get(supplier.id) ?? { id: supplier.id, name: supplier.name, items: [] };
    group.items.push(item);
    groups.set(supplier.id, group);
  }
  return [...groups.values()];
}

function SupplierCartGroup({ group }: { group: ReturnType<typeof groupCartItems>[number] }) {
  const supplierSubtotal = group.items.reduce((total, item) => total + cents(item.subtotal), 0n);
  return <section className="checkout-supplier-group"><header><div><p>Supplier order</p><h2>{group.name}</h2></div><span>{group.items.length} {group.items.length === 1 ? "product" : "products"}</span></header><div className="checkout-lines">{group.items.map((item) => <CheckoutCartLine item={item} key={item.id} />)}</div><footer><span>Supplier subtotal</span><strong>{money(fromCents(supplierSubtotal))}</strong></footer></section>;
}

function CheckoutCartLine({ item }: { item: CartItem }) {
  const image = productImageUrl(item.product.imageUrl);
  const availabilityWarning = item.availability !== "available";
  return <article className="checkout-line">{image ? <img src={image} alt={item.product.name} /> : <span className="checkout-line-image-placeholder">W</span>}<div className="checkout-line-info"><h3>{item.product.name}</h3><p>Quantity {item.quantity} · {money(item.product.unitPrice)} each</p>{availabilityWarning && <p className="checkout-availability-warning">Availability or stock needs review; checkout will validate this with the server.</p>}</div><strong>{money(item.subtotal)}</strong></article>;
}

export default function CheckoutPage() {
  const { cart, isLoading, error: cartError, refreshCart, setCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<{ message: string; stockConflict: boolean } | null>(null);
  const [confirmation, setConfirmation] = useState<CheckoutResponse | null>(null);
  const submissionLock = useRef(false);
  const groups = groupCartItems(cart?.items ?? []);
  const unitCount = cart?.items.reduce((count, item) => count + item.quantity, 0) ?? 0;

  const placeOrder = async () => {
    if (submissionLock.current || !cart?.items.length) return;
    submissionLock.current = true;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await checkout();
      setConfirmation(result);
      setCart({ id: cart.id, items: [], total: "0.00" });
      void refreshCart().catch(() => undefined);
    } catch (reason) {
      setSubmitError({
        message: getApiErrorMessage(reason),
        stockConflict: axios.isAxiosError(reason) && reason.response?.status === 409,
      });
    } finally {
      submissionLock.current = false;
      setIsSubmitting(false);
    }
  };

  if (confirmation) return <CheckoutConfirmation response={confirmation} />;

  return <div className="marketplace-checkout">
    <Link className="checkout-back-link" to="/cart">← Back to cart</Link>
    <header className="checkout-heading"><p className="checkout-eyebrow">SECURE CHECKOUT</p><h1>Review your order</h1><p>Your checkout creates a separate order for each supplier. All supplier orders are placed together in one transaction.</p></header>
    {cartError && <div className="checkout-alert" role="alert"><div><strong>Your cart could not be loaded</strong><p>{cartError}</p></div><Button size="sm" variant="outline" onClick={() => { void refreshCart().catch(() => undefined); }}>Retry</Button></div>}
    {submitError && <div className="checkout-alert" role="alert"><div><strong>{submitError.stockConflict ? "We couldn’t place your order" : "Checkout failed"}</strong><p>{submitError.stockConflict ? "Stock or product availability changed. No supplier orders were placed, and your cart is still available to review." : "No orders were placed. Your cart is still available to review and retry."}</p><p className="checkout-api-error">{submitError.message}</p></div></div>}
    {isLoading && !cart ? <div className="checkout-loading" aria-label="Loading checkout" aria-busy="true">{[1, 2].map((key) => <div key={key} />)}</div>
      : cartError ? <div className="checkout-unavailable">Retry loading your cart to review checkout.</div>
      : !cart?.items.length ? <section className="checkout-empty"><span aria-hidden="true">W</span><h2>Your cart is empty</h2><p>Add products before starting checkout.</p><Button nativeButton={false} render={<Link to="/products" />}>Browse products</Button></section>
      : <><div className="checkout-order-layout"><section className="checkout-supplier-list" aria-label="Orders grouped by supplier">{groups.map((group) => <SupplierCartGroup group={group} key={group.id} />)}</section><aside className="checkout-total-card"><h2>Checkout total</h2><div><span>Supplier orders</span><strong>{groups.length}</strong></div><div><span>Items</span><strong>{unitCount}</strong></div><div className="checkout-grand-total"><span>Total</span><strong>{money(cart.total)}</strong></div><p>The server will verify current prices, product availability, and stock before placing all orders.</p><Button className="checkout-place-order" onClick={() => void placeOrder()} disabled={isSubmitting || cart.items.length === 0}>{isSubmitting ? "Placing orders…" : `Place ${groups.length === 1 ? "order" : `${groups.length} orders`}`}</Button><Link className="checkout-edit-cart" to="/cart">Review cart</Link></aside></div></>}
  </div>;
}

function CheckoutConfirmation({ response }: { response: CheckoutResponse }) {
  return <div className="marketplace-checkout checkout-confirmation"><section className="checkout-success-banner"><span aria-hidden="true">✓</span><p className="checkout-eyebrow">ORDER CONFIRMED</p><h1>All supplier orders were placed.</h1><p>{response.orders.length} separate {response.orders.length === 1 ? "order was" : "orders were"} created successfully. Each supplier will manage their own order.</p></section><nav className="checkout-confirmation-links" aria-label="Created orders">{response.orders.map((order) => <a key={order.id} href={`#checkout-order-${order.id}`}>Order #{order.id} · {order.supplier.name}</a>)}</nav><div className="checkout-confirmed-orders">{response.orders.map((order) => <ConfirmedSupplierOrder order={order} key={order.id} />)}</div><div className="checkout-confirmation-footer"><Link to="/my-orders">Go to order history</Link><Link to="/products">Continue shopping</Link></div></div>;
}

function ConfirmedSupplierOrder({ order }: { order: CheckoutOrder }) {
  return <section className="checkout-confirmed-order" id={`checkout-order-${order.id}`}><header><div><p>Supplier order</p><h2>Order #{order.id}</h2><strong>{order.supplier.name}</strong></div><OrderStatusBadge status={order.status} /></header><div className="checkout-confirmed-lines">{order.items.map((item) => <div key={`${item.productId}-${item.productName}`}><div><strong>{item.productName}</strong><span>{item.quantity} × {money(item.unitPrice)}</span></div><strong>{money(item.subtotal)}</strong></div>)}</div><footer><span>Order total</span><strong>{money(order.totalAmount)}</strong></footer></section>;
}
