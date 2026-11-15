import { getApiErrorMessage } from "@/api/client";
import { listCategories } from "@/features/categories/api/categories.api";
import type { Category } from "@/features/categories/types/category.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listProducts, productImageUrl } from "@/features/products/api/products.api";
import type { Product, ProductListParams, ProductListResponse } from "@/features/products/types/product.types";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import "./marketplace-products.css";

const PAGE_SIZE = 12;
const sortOptions = ["newest", "price-asc", "price-desc"] as const;
type SortOption = (typeof sortOptions)[number];

function positiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function validPrice(value: string | null): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function productParams(params: URLSearchParams): ProductListParams {
  const sort = params.get("sort");
  const selectedSort: SortOption = sortOptions.includes(sort as SortOption) ? (sort as SortOption) : "newest";
  const categoryId = positiveInteger(params.get("category"), 0);
  const minPrice = validPrice(params.get("min"));
  const maxPrice = validPrice(params.get("max"));
  return {
    page: positiveInteger(params.get("page"), 1),
    limit: PAGE_SIZE,
    ...(params.get("q")?.trim() ? { search: params.get("q")!.trim() } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(minPrice !== undefined ? { minPrice } : {}),
    ...(maxPrice !== undefined ? { maxPrice } : {}),
    sortBy: selectedSort === "newest" ? "createdAt" : "price",
    sortOrder: selectedSort === "price-asc" ? "ASC" : "DESC",
  };
}

function updateParams(current: URLSearchParams, updates: Record<string, string | null>): URLSearchParams {
  const next = new URLSearchParams(current);
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
  }
  return next;
}

function CatalogSkeleton() {
  return <div className="marketplace-product-grid" aria-label="Loading products" aria-busy="true">{Array.from({ length: 8 }, (_, index) => <div className="marketplace-product-skeleton" key={index}><div className="marketplace-skeleton-image" /><div className="marketplace-skeleton-line" /><div className="marketplace-skeleton-line short" /></div>)}</div>;
}

function ProductCard({ product, catalogLocation }: { product: Product; catalogLocation: string }) {
  const available = product.stock > 0;
  const image = productImageUrl(product.imageUrl);
  return <article className="marketplace-product-card">
    <Link className="marketplace-product-image" to={`/products/${product.id}`} state={{ from: catalogLocation }} aria-label={`View ${product.name}`}>
      {image ? <img src={image} alt={product.name} loading="lazy" /> : <div className="marketplace-product-image-placeholder" aria-hidden="true"><span>Watermelon</span></div>}
      <span className={`marketplace-availability ${available ? "available" : "unavailable"}`}>{available ? "In stock" : "Out of stock"}</span>
    </Link>
    <div className="marketplace-product-card-body">
      <p className="marketplace-product-category">{product.category.name}</p>
      <h2><Link to={`/products/${product.id}`} state={{ from: catalogLocation }}>{product.name}</Link></h2>
      {product.description && <p className="marketplace-product-description">{product.description}</p>}
      <div className="marketplace-product-card-footer"><strong>${Number(product.price).toFixed(2)}</strong><Link className="marketplace-view-product" to={`/products/${product.id}`} state={{ from: catalogLocation }}>View product <span aria-hidden="true">↗</span></Link></div>
    </div>
  </article>;
}

export default function MarketplaceProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [searchDraft, setSearchDraft] = useState(searchParams.get("q") ?? "");
  const [minDraft, setMinDraft] = useState(searchParams.get("min") ?? "");
  const [maxDraft, setMaxDraft] = useState(searchParams.get("max") ?? "");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [result, setResult] = useState<ProductListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const queryString = searchParams.toString();
  const params = useMemo(() => productParams(new URLSearchParams(queryString)), [queryString]);
  const selectedCategory = searchParams.get("category") ?? "";
  const selectedSort = sortOptions.includes(searchParams.get("sort") as SortOption) ? searchParams.get("sort") as SortOption : "newest";
  const page = params.page;
  const rangeError = validPrice(minDraft) !== undefined && validPrice(maxDraft) !== undefined && Number(minDraft) > Number(maxDraft);

  useEffect(() => {
    setSearchDraft(searchParams.get("q") ?? "");
    setMinDraft(searchParams.get("min") ?? "");
    setMaxDraft(searchParams.get("max") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const value = searchDraft.trim();
      const currentValue = searchParams.get("q") ?? "";
      if (value !== currentValue) setSearchParams((current) => updateParams(current, { q: value || null, page: null }), { replace: true });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchDraft, searchParams, setSearchParams]);

  useEffect(() => {
    const controller = new AbortController();
    listCategories(controller.signal)
      .then((data) => { if (!controller.signal.aborted) setCategories(data); })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setCategoryError(getApiErrorMessage(reason)); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    listProducts(params, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setResult(data); })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(getApiErrorMessage(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [queryString, reload]);

  useEffect(() => {
    if (result && result.totalPages > 0 && page > result.totalPages) {
      setSearchParams((current) => updateParams(current, { page: String(result.totalPages) }), { replace: true });
    }
  }, [page, result, setSearchParams]);

  const setFilter = useCallback((updates: Record<string, string | null>) => {
    setSearchParams((current) => updateParams(current, { ...updates, page: null }));
  }, [setSearchParams]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchParams((current) => updateParams(current, { q: searchDraft.trim() || null, page: null }));
  };

  const clearFilters = () => {
    setSearchDraft("");
    setMinDraft("");
    setMaxDraft("");
    setSearchParams(new URLSearchParams());
  };

  const applyPriceRange = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (rangeError) return;
    setFilter({ min: minDraft.trim() || null, max: maxDraft.trim() || null });
  };

  const first = result?.total ? (result.page - 1) * result.limit + 1 : 0;
  const last = result ? Math.min(result.page * result.limit, result.total) : 0;
  const hasFilters = Boolean(searchParams.get("q") || selectedCategory || searchParams.get("min") || searchParams.get("max"));

  return <div className="marketplace-catalog">
    <section className="marketplace-catalog-hero"><div><p className="marketplace-eyebrow">WATERMELON MARKETPLACE</p><h1>Find what your business needs.</h1><p>Explore products from trusted suppliers, all in one place.</p></div><div className="marketplace-hero-mark" aria-hidden="true">W</div></section>
    <div className="marketplace-catalog-heading"><div><h2>Shop products</h2><p>{loading ? "Finding products…" : `${(result?.total ?? 0).toLocaleString()} product${result?.total === 1 ? "" : "s"} available`}</p></div><label className="marketplace-sort-control">Sort by <select value={selectedSort} onChange={(event) => setFilter({ sort: event.target.value === "newest" ? null : event.target.value })}><option value="newest">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></label></div>
    <div className="marketplace-catalog-layout">
      <aside className="marketplace-filter-panel" aria-label="Product filters">
        <div className="marketplace-filter-header"><h2>Filters</h2>{hasFilters && <button type="button" onClick={clearFilters}>Clear all</button>}</div>
        <form className="marketplace-search-form" onSubmit={submitSearch}><label htmlFor="catalog-search">Search products</label><div><Input id="catalog-search" type="search" placeholder="Search by product name" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} /><button type="submit" aria-label="Submit product search">⌕</button></div></form>
        <div className="marketplace-filter-section"><h3>Categories</h3>{categoryError ? <p className="marketplace-filter-error" role="alert">Categories could not be loaded. {categoryError}</p> : <><button type="button" className={`marketplace-category-option ${selectedCategory === "" ? "selected" : ""}`} onClick={() => setFilter({ category: null })}>All products</button>{categories.map((category) => <button type="button" className={`marketplace-category-option ${selectedCategory === String(category.id) ? "selected" : ""}`} key={category.id} onClick={() => setFilter({ category: String(category.id) })}>{category.name}</button>)}</>}</div>
        <form className="marketplace-filter-section marketplace-price-form" onSubmit={applyPriceRange}><h3>Price range</h3><div className="marketplace-price-fields"><label>Min<Input inputMode="decimal" type="number" min="0" step="0.01" value={minDraft} onChange={(event) => setMinDraft(event.target.value)} placeholder="$0" /></label><label>Max<Input inputMode="decimal" type="number" min="0" step="0.01" value={maxDraft} onChange={(event) => setMaxDraft(event.target.value)} placeholder="Any" /></label></div>{rangeError && <p className="marketplace-filter-error" role="alert">Minimum price must not exceed maximum price.</p>}<Button className="marketplace-apply-price" type="submit" variant="outline" disabled={rangeError}>Apply price</Button></form>
      </aside>
      <section className="marketplace-catalog-results" aria-label="Product results" aria-live="polite">
        {error ? <div className="marketplace-catalog-message marketplace-catalog-error"><h2>Products could not be loaded</h2><p role="alert">{error}</p><Button onClick={() => { setLoading(true); setReload((value) => value + 1); }}>Try again</Button></div>
          : loading ? <CatalogSkeleton />
          : result?.data.length ? <><div className="marketplace-product-grid">{result.data.map((product) => <ProductCard key={product.id} product={product} catalogLocation={`${location.pathname}${location.search}`} />)}</div><div className="marketplace-pagination"><span>Showing {first}–{last} of {result.total}</span><div><Button variant="outline" disabled={page <= 1} onClick={() => setSearchParams((current) => updateParams(current, { page: String(page - 1) }))}>Previous</Button><span>Page {result.page} of {Math.max(1, result.totalPages)}</span><Button variant="outline" disabled={page >= result.totalPages} onClick={() => setSearchParams((current) => updateParams(current, { page: String(page + 1) }))}>Next</Button></div></div></>
          : <div className="marketplace-catalog-message"><span className="marketplace-empty-mark" aria-hidden="true">W</span><h2>{hasFilters ? "No products match your filters" : "No products are available yet"}</h2><p>{hasFilters ? "Try a different search or remove one of your filters." : "Check back soon for new products from our suppliers."}</p>{hasFilters && <Button variant="outline" onClick={clearFilters}>Clear filters</Button>}</div>}
      </section>
    </div>
  </div>;
}
