import { getApiErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { listCategories } from "@/features/categories/api/categories.api";
import type { Category } from "@/features/categories/types/category.types";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import "./marketplace-home.css";

function CategoryCard({ category, index }: { category: Category; index: number }) {
  return (
    <Link
      className="marketplace-home-category"
      to={`/products?category=${category.id}`}
    >
      <div className="marketplace-home-category-art" aria-hidden="true">
        <span className="marketplace-home-category-number">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="marketplace-home-category-letter">
          {category.name.trim().charAt(0).toUpperCase()}
        </span>
        <span className="marketplace-home-category-orbit" />
      </div>
      <div className="marketplace-home-category-copy">
        <div>
          <h3>{category.name}</h3>
          <p>{category.description || "Explore products in this category."}</p>
        </div>
        <span className="marketplace-home-category-arrow" aria-hidden="true">
          ↗
        </span>
      </div>
      {typeof category.productCount === "number" && (
        <span className="marketplace-home-category-count">
          {category.productCount} {category.productCount === 1 ? "product" : "products"}
        </span>
      )}
    </Link>
  );
}

export default function MarketplaceHome() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    listCategories(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setCategories(items);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(getApiErrorMessage(reason));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reload]);

  return (
    <div className="marketplace-home">
      <section className="marketplace-home-hero">
        <div className="marketplace-home-hero-copy">
          <p className="marketplace-home-eyebrow">WATERMELON MARKETPLACE</p>
          <h1>Good things for your business, all in one place.</h1>
          <p className="marketplace-home-intro">
            Discover products from trusted suppliers and make sourcing feel simple.
          </p>
          <Button
            nativeButton={false}
            render={<Link to="/products" />}
            className="marketplace-home-cta"
          >
            Explore products <span aria-hidden="true">↗</span>
          </Button>
        </div>
        <div className="marketplace-home-hero-art" aria-hidden="true">
          <span className="marketplace-home-hero-ring" />
          <span className="marketplace-home-hero-disc">W</span>
          <span className="marketplace-home-hero-label">Source smarter</span>
          <span className="marketplace-home-hero-spark">✳</span>
        </div>
      </section>

      <section className="marketplace-home-categories" aria-labelledby="home-categories-title">
        <div className="marketplace-home-section-heading">
          <div>
            <p className="marketplace-home-eyebrow">BROWSE BY CATEGORY</p>
            <h2 id="home-categories-title">Find your next favorite.</h2>
            <p>Start with a category and explore what our suppliers have to offer.</p>
          </div>
          <Link className="marketplace-home-all-link" to="/products">
            View all products <span aria-hidden="true">→</span>
          </Link>
        </div>

        {loading ? (
          <div className="marketplace-home-category-grid" aria-label="Loading categories" aria-busy="true">
            {Array.from({ length: 5 }, (_, index) => (
              <div className="marketplace-home-category-skeleton" key={index}>
                <div />
                <span />
                <span />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="marketplace-home-state marketplace-home-error" role="alert">
            <h3>Categories could not be loaded</h3>
            <p>{error}</p>
            <Button variant="outline" onClick={() => setReload((value) => value + 1)}>
              Try again
            </Button>
          </div>
        ) : categories.length ? (
          <div className="marketplace-home-category-grid">
            {categories.map((category, index) => (
              <CategoryCard key={category.id} category={category} index={index} />
            ))}
          </div>
        ) : (
          <div className="marketplace-home-state">
            <h3>Categories are coming soon</h3>
            <p>Browse all products to see what is currently available.</p>
            <Button nativeButton={false} render={<Link to="/products" />}>
              Browse products
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
