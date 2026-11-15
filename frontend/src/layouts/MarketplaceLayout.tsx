import { Link, Outlet } from "react-router";
import "./marketplace-layout.css";

export default function MarketplaceLayout() {
  return (
    <div className="marketplace-shell">
      <header className="marketplace-header">
        <Link className="marketplace-brand" to="/">
          Watermelon Market
        </Link>
        <nav aria-label="Marketplace navigation">
          <Link to="/">Home</Link>
          <Link to="/dashboard">Dashboard</Link>
        </nav>
      </header>
      <main className="marketplace-main">
        <Outlet />
      </main>
    </div>
  );
}
