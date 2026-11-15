import { getApiErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { deleteProduct, getMyProduct, listProductCategories, productImageUrl, updateProduct } from "../api/products.api";
import { ProductActionDialog } from "../components/ProductActionDialog";
import { ProductForm, type ProductFormValues } from "../components/ProductForm";
import type { CategoryOption, Product } from "../types/product.types";

export default function ProductDetailsPage() {
  const { id: rawId = "" } = useParams();
  const id = /^\d+$/.test(rawId) ? Number(rawId) : NaN;
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [action, setAction] = useState<"delete" | "activate" | "deactivate" | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!Number.isSafeInteger(id) || id < 1) { setLoading(false); setError("Invalid product ID."); return; }
    const controller = new AbortController(); setLoading(true); setError(null);
    getMyProduct(id, controller.signal)
      .then((item) => { if (!controller.signal.aborted) setProduct(item); })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(getApiErrorMessage(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, reload]);

  useEffect(() => {
    const controller = new AbortController();
    listProductCategories(controller.signal)
      .then((options) => { if (!controller.signal.aborted) setCategories(options); })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setCategoriesError(getApiErrorMessage(reason)); });
    return () => controller.abort();
  }, []);

  const submit = async (values: ProductFormValues, image: File | null) => {
    setFormError(null); setSuccess(null);
    try {
      const updated = await updateProduct(id, { name: values.name.trim().replace(/\s+/g, " "), description: values.description.trim(), price: values.price, stock: values.stock, categoryId: values.categoryId, isActive: values.isActive, image });
      setProduct(updated); setEditing(false); setSuccess("Product updated successfully.");
    } catch (reason) { setFormError(getApiErrorMessage(reason)); }
  };
  const confirmAction = async () => {
    if (!product || !action) return;
    if (action === "delete") { await deleteProduct(id); void navigate("/dashboard/supplier/products", { replace: true }); return; }
    const updated = await updateProduct(id, { isActive: action === "activate" });
    setProduct(updated); setSuccess(`Product ${action === "activate" ? "activated" : "deactivated"}.`); setAction(null);
  };

  if (loading) return <div className="space-y-4" aria-label="Loading product"><div className="h-8 w-64 animate-pulse rounded bg-gray-100 dark:bg-gray-800" /><div className="h-72 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" /></div>;
  if (error || !product || product.id !== id) return <section className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center dark:border-gray-800 dark:bg-white/[0.03]"><h1 className="text-lg font-semibold text-gray-800 dark:text-white/90">Unable to load product</h1><p role="alert" className="mt-2 text-sm text-red-600">{error ?? "Product not found."}</p><div className="mt-5 flex justify-center gap-3"><Button variant="outline" onClick={() => { setError(null); setLoading(true); setReload((value) => value + 1); }}>Try again</Button><Button variant="outline" nativeButton={false} render={<Link to="/dashboard/supplier/products" />}>Back to products</Button></div></section>;

  return <>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Product details</p><h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">{product.name}</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage listing details and marketplace status.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => { setEditing((value) => !value); setFormError(null); setSuccess(null); }}>{editing ? "Cancel edit" : "Edit product"}</Button><Button variant={product.isActive ? "outline" : "default"} onClick={() => setAction(product.isActive ? "deactivate" : "activate")}>{product.isActive ? "Deactivate" : "Activate"}</Button><Button variant="destructive" onClick={() => setAction("delete")}>Delete</Button></div></div>
    {success && <p role="status" className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-500/10 dark:text-green-400">{success}</p>}
    {categoriesError && <p role="alert" className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">Could not load categories: {categoriesError}</p>}
    {editing ? <section className="max-w-4xl rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-7"><ProductForm key={`${product.id}-${product.updatedAt}`} categories={categories} initialValues={{ name: product.name, description: product.description ?? "", price: product.price, stock: String(product.stock), categoryId: String(product.category.id), isActive: product.isActive }} currentImage={product.imageUrl} apiError={formError} submitLabel="Save product" onSubmit={submit} /></section>
      : <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]"><div className="grid gap-6 p-5 md:grid-cols-[240px_1fr] sm:p-7">{product.imageUrl ? <img src={productImageUrl(product.imageUrl) ?? undefined} alt={product.name} className="aspect-square w-full max-w-60 rounded-xl border border-gray-200 object-cover dark:border-gray-800" /> : <div className="aspect-square w-full max-w-60 rounded-xl bg-gray-100 dark:bg-gray-800" />}<dl className="grid content-start gap-x-8 gap-y-5 sm:grid-cols-2"><div><dt className="text-sm text-gray-500 dark:text-gray-400">Price</dt><dd className="mt-1 font-medium text-gray-800 dark:text-white/90">${Number(product.price).toFixed(2)}</dd></div><div><dt className="text-sm text-gray-500 dark:text-gray-400">Stock</dt><dd className="mt-1 font-medium text-gray-800 dark:text-white/90">{product.stock}</dd></div><div><dt className="text-sm text-gray-500 dark:text-gray-400">Category</dt><dd className="mt-1 font-medium text-gray-800 dark:text-white/90">{product.category.name}</dd></div><div><dt className="text-sm text-gray-500 dark:text-gray-400">Status</dt><dd className="mt-1 font-medium text-gray-800 dark:text-white/90">{product.isActive ? "Active" : "Inactive"}</dd></div><div className="sm:col-span-2"><dt className="text-sm text-gray-500 dark:text-gray-400">Description</dt><dd className="mt-1 whitespace-pre-wrap text-gray-800 dark:text-white/90">{product.description || "No description provided."}</dd></div><div><dt className="text-sm text-gray-500 dark:text-gray-400">Created</dt><dd className="mt-1 text-sm text-gray-700 dark:text-gray-300">{new Date(product.createdAt).toLocaleString()}</dd></div><div><dt className="text-sm text-gray-500 dark:text-gray-400">Last updated</dt><dd className="mt-1 text-sm text-gray-700 dark:text-gray-300">{new Date(product.updatedAt).toLocaleString()}</dd></div></dl></div></section>}
    <div className="mt-5"><Button variant="outline" nativeButton={false} render={<Link to="/dashboard/supplier/products" />}>Back to products</Button></div>
    <ProductActionDialog key={`${product.id}-${action ?? "closed"}`} product={action ? product : null} action={action ?? "delete"} onOpenChange={(open) => { if (!open) setAction(null); }} onConfirm={confirmAction} />
  </>;
}
