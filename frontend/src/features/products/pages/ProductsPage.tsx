import { getApiErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { listMyProducts, listProductCategories, productImageUrl } from "../api/products.api";
import type { CategoryOption, Product, ProductListResponse } from "../types/product.types";

const PAGE_SIZE = 10;

export default function ProductsPage() {
  const [result, setResult] = useState<ProductListResponse | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [active, setActive] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => { const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250); return () => window.clearTimeout(timer); }, [search]);
  useEffect(() => { const controller = new AbortController(); listProductCategories(controller.signal).then(setCategories).catch((reason: unknown) => { if (!controller.signal.aborted) setCategoryError(getApiErrorMessage(reason)); }); return () => controller.abort(); }, []);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(null);
    const params = { page, limit: PAGE_SIZE, ...(debouncedSearch ? { search: debouncedSearch } : {}), ...(categoryId ? { categoryId: Number(categoryId) } : {}), ...(active !== "all" ? { isActive: active === "active" } : {}), sortBy: "createdAt" as const, sortOrder: "DESC" as const };
    listMyProducts(params, controller.signal).then((data) => { if (!controller.signal.aborted) setResult(data); }).catch((reason: unknown) => { if (!controller.signal.aborted) setError(getApiErrorMessage(reason)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, debouncedSearch, categoryId, active, reload]);
  const first = result?.total ? (result.page - 1) * result.limit + 1 : 0;
  const last = result ? Math.min(result.page * result.limit, result.total) : 0;

  return <>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Supplier dashboard</p><h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">My products</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your product listings, stock, and marketplace visibility.</p></div><Button nativeButton={false} render={<Link to="/dashboard/supplier/products/new" />}>Create product</Button></div>
    {categoryError && <p role="alert" className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">Category options could not be loaded: {categoryError}</p>}
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6"><div><h2 className="font-medium text-gray-800 dark:text-white/90">Product inventory</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{loading ? "Loading products…" : `${result?.total ?? 0} product${result?.total === 1 ? "" : "s"}`}</p></div><div className="grid w-full gap-2 sm:w-auto sm:grid-cols-3"><Input type="search" aria-label="Search products" placeholder="Search product name" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /><select aria-label="Filter products by category" className="h-11 rounded-[10px] border border-gray-300 bg-white px-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setPage(1); }}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><select aria-label="Filter products by status" className="h-11 rounded-[10px] border border-gray-300 bg-white px-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" value={active} onChange={(event) => { setActive(event.target.value); setPage(1); }}><option value="all">All status</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div></div>
      {error ? <div className="px-6 py-14 text-center"><p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p><Button className="mt-4" variant="outline" onClick={() => { setLoading(true); setReload((value) => value + 1); }}>Try again</Button></div>
        : loading ? <div className="space-y-3 p-6" aria-label="Loading products">{[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />)}</div>
        : result?.data.length ? <><div className="overflow-x-auto"><Table><TableHeader><TableRow className="border-b border-gray-100 dark:border-gray-800"><TableCell isHeader className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Product</TableCell><TableCell isHeader className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Category</TableCell><TableCell isHeader className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Price / stock</TableCell><TableCell isHeader className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</TableCell><TableCell isHeader className="px-5 py-3 text-end text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Action</TableCell></TableRow></TableHeader><TableBody>{result.data.map((product: Product) => <TableRow key={product.id} className="border-b border-gray-100 last:border-0 dark:border-gray-800"><TableCell className="px-5 py-4"><div className="flex items-center gap-3">{product.imageUrl ? <img src={productImageUrl(product.imageUrl) ?? undefined} alt="" className="size-12 rounded-lg object-cover" /> : <div className="size-12 rounded-lg bg-gray-100 dark:bg-gray-800" />}<div><Link className="font-medium text-gray-800 hover:text-brand-500 dark:text-white/90" to={`/dashboard/supplier/products/${product.id}`}>{product.name}</Link><p className="mt-1 max-w-sm truncate text-sm text-gray-500 dark:text-gray-400">{product.description || "No description"}</p></div></div></TableCell><TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{product.category.name}</TableCell><TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">${Number(product.price).toFixed(2)}<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Stock: {product.stock}</p></TableCell><TableCell className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${product.isActive ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}>{product.isActive ? "Active" : "Inactive"}</span></TableCell><TableCell className="px-5 py-4 text-end"><Button size="sm" variant="outline" nativeButton={false} render={<Link to={`/dashboard/supplier/products/${product.id}`} />}>Manage</Button></TableCell></TableRow>)}</TableBody></Table></div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 dark:border-gray-800"><p className="text-sm text-gray-500 dark:text-gray-400">Showing {first}–{last} of {result.total}</p><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><span className="text-sm text-gray-500 dark:text-gray-400">Page {result.page} of {Math.max(1, result.totalPages)}</span><Button variant="outline" size="sm" disabled={page >= result.totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button></div></div></>
        : <div className="px-6 py-14 text-center"><p className="text-sm text-gray-600 dark:text-gray-300">{debouncedSearch || categoryId || active !== "all" ? "No products match these filters." : "You have not added any products yet."}</p>{!debouncedSearch && !categoryId && active === "all" && <Button className="mt-4" nativeButton={false} render={<Link to="/dashboard/supplier/products/new" />}>Add your first product</Button>}</div>}
    </section>
  </>;
}
