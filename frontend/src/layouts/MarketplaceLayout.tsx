import { Link, Outlet } from "react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCart } from "@/features/cart/hooks/useCart";
import { CartIcon } from "@/icons";
import "./marketplace-layout.css";

export default function MarketplaceLayout() {
  const { user, logout, isLoading } = useAuth();
  const { cart, isLoading: isCartLoading } = useCart();
  const cartCount = cart?.items.reduce((count, item) => count + item.quantity, 0) ?? 0;
  const cartDestination = user?.role.name === "buyer"
    ? "/cart"
    : user?.role.name === "admin"
      ? "/dashboard/admin"
      : user?.role.name === "supplier"
        ? "/dashboard/supplier"
        : "/login";
  return (
    <div className="marketplace-shell">
      <header className="marketplace-header">
        <Link className="marketplace-brand" to="/">
          Watermelon Market
        </Link>
        <nav aria-label="Marketplace navigation">
          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>
          {isLoading ? <span className="marketplace-cart-link marketplace-cart-link-loading" aria-label="Loading account" /> : <Link className="marketplace-cart-link" to={cartDestination} state={!user ? { from: "/cart" } : undefined} aria-label={user?.role.name === "buyer" ? `Shopping cart, ${cartCount} items` : "Shopping cart"}>
            <CartIcon className="marketplace-cart-nav-icon" />
            <span>Cart</span>
            {user?.role.name === "buyer" && <span className="marketplace-cart-count" aria-live="polite">{isCartLoading && !cart ? "…" : cartCount}</span>}
          </Link>}
          {user ? (
            <>
              <Link to={user.role.name === "buyer" ? "/my-orders" : "/dashboard"}>
                {user.name}
              </Link>
              <button className="marketplace-signout" type="button" onClick={logout}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link className="marketplace-nav-login" to="/login">
                Log in
              </Link>
              <Link className="marketplace-nav-signup" to="/register">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>
      <main className="marketplace-main">
        <Outlet />
      </main>
    </div>
  );
}
