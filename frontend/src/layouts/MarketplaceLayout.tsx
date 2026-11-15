import { Link, Outlet } from "react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import "./marketplace-layout.css";

export default function MarketplaceLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="marketplace-shell">
      <header className="marketplace-header">
        <Link className="marketplace-brand" to="/">
          Watermelon Market
        </Link>
        <nav aria-label="Marketplace navigation">
          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>
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
