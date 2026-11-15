import { getApiErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { listCategories } from "../api/categories.api";
import { CategoryPageHeader } from "../components/CategoryPageHeader";
import type { Category } from "../types/category.types";

const PAGE_SIZE = 10;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(null);
    listCategories(controller.signal)
      .then((result) => { if (!controller.signal.aborted) setCategories(result); })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(getApiErrorMessage(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [reload]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return categories.filter((category) => category.name.toLowerCase().includes(term));
  }, [categories, search]);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return <>
    <CategoryPageHeader eyebrow="Admin dashboard" title="Categories" description="Organize marketplace products with category names and descriptions." action={<Button nativeButton={false} render={<Link to="/dashboard/admin/categories/new" />}>Create category</Button>} />
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6"><div><h2 className="font-medium text-gray-800 dark:text-white/90">Category list</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{loading ? "Loading categories…" : `${filtered.length} categor${filtered.length === 1 ? "y" : "ies"}`}</p></div><div className="w-full sm:w-72"><Input type="search" aria-label="Search categories by name" placeholder="Search category name" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></div></div>
      {error ? <div className="px-6 py-14 text-center"><p role="alert" className="text-sm text-red-600">{error}</p><Button className="mt-4" variant="outline" onClick={() => { setLoading(true); setReload((value) => value + 1); }}>Try again</Button></div>
        : loading ? <div className="space-y-3 p-6" aria-label="Loading categories">{[1, 2, 3].map((item) => <div key={item} className="h-14 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />)}</div>
        : visible.length ? <><div className="overflow-x-auto"><Table><TableHeader><TableRow className="border-b border-gray-100 dark:border-gray-800"><TableCell isHeader className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wide text-gray-500">Category</TableCell><TableCell isHeader className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wide text-gray-500">Products</TableCell><TableCell isHeader className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wide text-gray-500">Updated</TableCell><TableCell isHeader className="px-5 py-3 text-end text-xs font-medium uppercase tracking-wide text-gray-500">Action</TableCell></TableRow></TableHeader><TableBody>{visible.map((category) => <TableRow key={category.id} className="border-b border-gray-100 last:border-0 dark:border-gray-800"><TableCell className="px-5 py-4"><Link className="font-medium text-gray-800 hover:text-brand-500 dark:text-white/90" to={`/dashboard/admin/categories/${category.id}`}>{category.name}</Link><p className="mt-1 max-w-xl truncate text-sm text-gray-500 dark:text-gray-400">{category.description || "No description provided."}</p></TableCell><TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{typeof category.productCount === "number" ? category.productCount : "—"}</TableCell><TableCell className="whitespace-nowrap px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{new Date(category.updatedAt).toLocaleDateString()}</TableCell><TableCell className="px-5 py-4 text-end"><Button size="sm" variant="outline" nativeButton={false} render={<Link to={`/dashboard/admin/categories/${category.id}`} />}>View details</Button></TableCell></TableRow>)}</TableBody></Table></div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 dark:border-gray-800"><p className="text-sm text-gray-500 dark:text-gray-400">Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button><span className="self-center px-2 text-sm text-gray-500">Page {currentPage} of {Math.max(1, totalPages)}</span><Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button></div></div></>
        : <div className="px-6 py-14 text-center"><p className="text-sm text-gray-600 dark:text-gray-300">{search ? "No categories match your search." : "No categories yet."}</p>{!search && <Button className="mt-4" nativeButton={false} render={<Link to="/dashboard/admin/categories/new" />}>Create the first category</Button>}</div>}
    </section>
  </>;
}
