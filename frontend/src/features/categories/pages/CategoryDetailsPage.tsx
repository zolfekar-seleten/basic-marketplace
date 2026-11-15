import { getApiErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { deleteCategory, getCategory, updateCategory } from "../api/categories.api";
import { CategoryForm, type CategoryFormValues } from "../components/CategoryForm";
import { DeleteCategoryDialog } from "../components/DeleteCategoryDialog";
import { CategoryPageHeader } from "../components/CategoryPageHeader";
import type { Category } from "../types/category.types";

export default function CategoryDetailsPage() {
  const { id: idParam = "" } = useParams();
  const id = /^\d+$/.test(idParam) ? Number(idParam) : NaN;
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!Number.isSafeInteger(id) || id < 1) { setLoading(false); setLoadError("Invalid category ID."); return; }
    const controller = new AbortController();
    setLoading(true); setLoadError(null);
    getCategory(id, controller.signal)
      .then((item) => { if (!controller.signal.aborted) setCategory(item); })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setLoadError(getApiErrorMessage(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, reload]);

  const submit = async (values: CategoryFormValues) => {
    setFormError(null); setSuccess(null);
    try {
      const updated = await updateCategory(id, { name: values.name.trim().replace(/\s+/g, " "), description: values.description.trim() || null });
      setCategory(updated); setEditing(false); setSuccess("Category updated successfully.");
    } catch (reason) { setFormError(getApiErrorMessage(reason)); }
  };

  const remove = async () => {
    await deleteCategory(id);
    void navigate("/dashboard/admin/categories", { replace: true });
  };

  if (loading) return <div className="space-y-4" aria-label="Loading category"><div className="h-8 w-64 animate-pulse rounded bg-gray-100 dark:bg-gray-800" /><div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" /></div>;
  if (loadError || !category || category.id !== id) return <section className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center dark:border-gray-800 dark:bg-white/[0.03]"><h1 className="text-lg font-semibold text-gray-800 dark:text-white/90">Unable to load category</h1><p role="alert" className="mt-2 text-sm text-red-600">{loadError ?? "Category not found."}</p><div className="mt-5 flex justify-center gap-3"><Button variant="outline" onClick={() => { setLoadError(null); setLoading(true); setReload((value) => value + 1); }}>Try again</Button><Button variant="outline" nativeButton={false} render={<Link to="/dashboard/admin/categories" />}>Back to categories</Button></div></section>;

  return <>
    <CategoryPageHeader eyebrow="Category details" title={category.name} description="View and update category information or remove an unused category." action={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => { setEditing((value) => !value); setFormError(null); setSuccess(null); }}>{editing ? "Cancel edit" : "Edit category"}</Button><Button variant="destructive" onClick={() => setDeleteOpen(true)}>Delete category</Button></div>} />
    {success && <p role="status" className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-500/10 dark:text-green-400">{success}</p>}
    {editing ? <section className="max-w-3xl rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-7"><div className="mb-6 border-b border-gray-200 pb-5 dark:border-gray-800"><h2 className="font-medium text-gray-800 dark:text-white/90">Edit category</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Category names must be unique.</p></div><CategoryForm key={`${category.id}-${category.updatedAt}`} initialValues={{ name: category.name, description: category.description ?? "" }} apiError={formError} onSubmit={submit} /></section>
      : <section className="max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]"><dl className="grid gap-x-8 gap-y-6 px-5 py-6 sm:grid-cols-2 sm:px-7 sm:py-8"><div><dt className="text-sm text-gray-500 dark:text-gray-400">Category ID</dt><dd className="mt-1 font-medium text-gray-800 dark:text-white/90">#{category.id}</dd></div><div><dt className="text-sm text-gray-500 dark:text-gray-400">Products</dt><dd className="mt-1 font-medium text-gray-800 dark:text-white/90">{typeof category.productCount === "number" ? category.productCount : "Not provided by API"}</dd></div><div><dt className="text-sm text-gray-500 dark:text-gray-400">Created</dt><dd className="mt-1 font-medium text-gray-800 dark:text-white/90">{new Date(category.createdAt).toLocaleString()}</dd></div><div><dt className="text-sm text-gray-500 dark:text-gray-400">Last updated</dt><dd className="mt-1 font-medium text-gray-800 dark:text-white/90">{new Date(category.updatedAt).toLocaleString()}</dd></div><div className="sm:col-span-2"><dt className="text-sm text-gray-500 dark:text-gray-400">Description</dt><dd className="mt-1 whitespace-pre-wrap text-gray-800 dark:text-white/90">{category.description || "No description provided."}</dd></div></dl></section>}
    <div className="mt-5"><Button variant="outline" nativeButton={false} render={<Link to="/dashboard/admin/categories" />}>Back to categories</Button></div>
    <DeleteCategoryDialog key={`${category.id}-${deleteOpen}`} category={deleteOpen ? category : null} onOpenChange={setDeleteOpen} onConfirm={remove} />
  </>;
}
