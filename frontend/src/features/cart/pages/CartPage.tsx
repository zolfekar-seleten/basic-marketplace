import { getApiErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart/hooks/useCart";
import { clearCart, addCartItem, removeCartItem, updateCartItem } from "@/features/cart/api/cart.api";
import { productImageUrl } from "@/features/products/api/products.api";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import type { CartItem } from "../types/cart.types";
import "./cart-page.css";

function currency(value: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value));
}

export default function CartPage() {
  const { cart, isLoading, error, refreshCart, setCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const processedIntent = useRef<string | null>(null);
  const requestedProductId = searchParams.get("addProductId");

  useEffect(() => {
    if (!requestedProductId || isLoading) return;
    const intent = `${location.key}:${requestedProductId}`;
    if (processedIntent.current === intent) return;
    processedIntent.current = intent;
    const productId = Number(requestedProductId);
    if (!Number.isInteger(productId) || productId <= 0) {
      setActionError("The product could not be added because its link was invalid.");
      setSearchParams((current) => { const next = new URLSearchParams(current); next.delete("addProductId"); return next; }, { replace: true });
      return;
    }
    setBusyAction("pending-add");
    setActionError(null);
    addCartItem(productId, 1)
      .then(setCart)
      .catch((reason: unknown) => setActionError(getApiErrorMessage(reason)))
      .finally(() => {
        setBusyAction(null);
        setSearchParams((current) => { const next = new URLSearchParams(current); next.delete("addProductId"); return next; }, { replace: true });
      });
  }, [requestedProductId, isLoading, location.key, setCart, setSearchParams]);

  const performCartAction = async (action: string, request: () => Promise<NonNullable<typeof cart>>) => {
    setBusyAction(action);
    setActionError(null);
    try {
      const updated = await request();
      if (updated) setCart(updated);
    } catch (reason) {
      setActionError(getApiErrorMessage(reason));
    } finally {
      setBusyAction(null);
    }
  };

  const changeQuantity = (item: CartItem, quantity: number) => {
    if (quantity < 1 || quantity > item.product.stock || !item.product.isActive) return;
    void performCartAction(`item-${item.id}`, () => updateCartItem(item.id, quantity));
  };

  const handleClearCart = () => {
    if (!cart?.items.length || !window.confirm("Remove all items from your cart?")) return;
    void performCartAction("clear", clearCart);
  };

  return <div className="marketplace-cart-page">
    <div className="marketplace-cart-heading"><div><p className="marketplace-cart-eyebrow">YOUR MARKETPLACE</p><h1>Shopping cart</h1><p>{cart?.items.length ?? 0} {cart?.items.length === 1 ? "product" : "products"} in your cart</p></div>{Boolean(cart?.items.length) && <Button variant="outline" onClick={handleClearCart} disabled={Boolean(busyAction)}>Remove all items</Button>}</div>
    {(error || actionError) && <div className="marketplace-cart-alert" role="alert"><div><strong>{actionError ? "Cart update failed" : "Cart could not be loaded"}</strong><p>{actionError ?? error}</p></div>{error && <Button size="sm" variant="outline" onClick={() => { void refreshCart().catch(() => undefined); }}>Retry</Button>}</div>}
    {busyAction === "pending-add" && <p className="marketplace-cart-success" role="status">Adding the product you selected…</p>}
    {isLoading && !cart ? <div className="marketplace-cart-loading" aria-label="Loading cart" aria-busy="true">{[1, 2].map((item) => <div className="marketplace-cart-skeleton" key={item}><span /><div><i /><i /></div></div>)}</div>
      : cart?.items.length ? <div className="marketplace-cart-layout"><section className="marketplace-cart-items" aria-label="Cart items">{cart.items.map((item) => <CartItemRow key={item.id} item={item} busy={busyAction === `item-${item.id}`} onQuantityChange={(quantity) => changeQuantity(item, quantity)} onRemove={() => void performCartAction(`item-${item.id}`, () => removeCartItem(item.id))} />)}</section><aside className="marketplace-cart-summary"><h2>Order summary</h2><div className="marketplace-cart-summary-line"><span>Items ({cart.items.reduce((count, item) => count + item.quantity, 0)})</span><span>{currency(cart.total)}</span></div><div className="marketplace-cart-summary-total"><span>Cart total</span><strong>{currency(cart.total)}</strong></div><p>Shipping and taxes are not included.</p><Link className="marketplace-continue-shopping" to="/products">Continue shopping</Link></aside></div>
      : !isLoading && !error && <section className="marketplace-cart-empty"><span aria-hidden="true">♡</span><h2>Your cart is waiting</h2><p>Browse the marketplace and add products to your cart.</p><Button nativeButton={false} render={<Link to="/products" />}>Explore products</Button></section>}
  </div>;
}

function CartItemRow({ item, busy, onQuantityChange, onRemove }: { item: CartItem; busy: boolean; onQuantityChange: (quantity: number) => void; onRemove: () => void }) {
  const image = productImageUrl(item.product.imageUrl);
  const availabilityMessage = item.availability === "inactive"
    ? "This product is no longer active. Remove it to continue."
    : item.availability === "insufficient_stock"
      ? `Only ${item.product.stock} currently available. Reduce the quantity to continue.`
      : null;
  return <article className="marketplace-cart-item">
    <Link className="marketplace-cart-item-image" to={`/products/${item.product.id}`} aria-label={`View ${item.product.name}`}>
      {image ? <img src={image} alt={item.product.name} /> : <span aria-hidden="true">W</span>}
    </Link>
    <div className="marketplace-cart-item-info"><h2><Link to={`/products/${item.product.id}`}>{item.product.name}</Link></h2><p>{currency(item.product.unitPrice)} each</p>{availabilityMessage && <p className="marketplace-cart-item-warning" role="alert">{availabilityMessage}</p>}<button className="marketplace-cart-remove" type="button" onClick={onRemove} disabled={busy}>Remove</button></div>
    <div className="marketplace-cart-item-quantity"><span>Quantity</span><div><button type="button" aria-label={`Decrease ${item.product.name} quantity`} disabled={busy || !item.product.isActive || item.quantity <= 1} onClick={() => onQuantityChange(item.quantity - 1)}>−</button><output aria-label="Quantity">{item.quantity}</output><button type="button" aria-label={`Increase ${item.product.name} quantity`} disabled={busy || !item.product.available || item.quantity >= item.product.stock} onClick={() => onQuantityChange(item.quantity + 1)}>+</button></div></div>
    <strong className="marketplace-cart-item-subtotal">{currency(item.subtotal)}</strong>
  </article>;
}
