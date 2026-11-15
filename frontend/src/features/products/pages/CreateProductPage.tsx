import { getApiErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { createProduct, listProductCategories } from "../api/products.api";
import { ProductForm, type ProductFormValues } from "../components/ProductForm";
import type { CategoryOption } from "../types/product.types";

export default function CreateProductPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { const controller = new AbortController(); listProductCategories(controller.signal).then((items) => { if (!controller.signal.aborted) setCategories(items); }).catch((reason: unknown) => { if (!controller.signal.aborted) setError(getApiErrorMessage(reason)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); }); return () => controller.abort(); }, []);

  const submit = async (values: ProductFormValues, image: File | null) => {
    setError(null);
    try {
      const product = await createProduct({ name: values.name.trim().replace(/\s+/g, " "), description: values.description.trim(), price: values.price, stock: values.stock, categoryId: values.categoryId, isActive: values.isActive, image });
      void navigate(`/dashboard/supplier/products/${product.id}`);
    } catch (reason) { setError(getApiErrorMessage(reason)); }
  };
  return <><div className="mb-6"><p className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Product management</p><h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Create product</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add a product to your supplier catalog.</p></div>
    {loading ? <div className="h-72 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" aria-label="Loading categories" /> : error && categories.length === 0 ? <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-white/[0.03]"><p role="alert" className="text-sm text-red-600">Unable to load categories: {error}</p><Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>Reload page</Button></section> : categories.length === 0 ? <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-white/[0.03]"><p className="text-sm text-gray-600 dark:text-gray-300">No categories are available. Ask an administrator to create a category first.</p><Button className="mt-4" variant="outline" nativeButton={false} render={<Link to="/dashboard/supplier/products" />}>Back to products</Button></section>
    : <section className="mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-7"><ProductForm categories={categories} apiError={error} submitLabel="Create product" onSubmit={submit} /><div className="mt-4 flex justify-end"><Button variant="outline" nativeButton={false} render={<Link to="/dashboard/supplier/products" />}>Cancel</Button></div></section>}</>;
}
