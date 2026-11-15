import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/api/client";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { createCategory } from "../api/categories.api";
import { CategoryForm, type CategoryFormValues } from "../components/CategoryForm";
import { CategoryPageHeader } from "../components/CategoryPageHeader";

export default function CreateCategoryPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const submit = async (values: CategoryFormValues) => {
    setError(null);
    try {
      const category = await createCategory({ name: values.name.trim().replace(/\s+/g, " "), description: values.description.trim() || null });
      void navigate(`/dashboard/admin/categories/${category.id}`);
    } catch (reason) { setError(getApiErrorMessage(reason)); }
  };
  return <><CategoryPageHeader eyebrow="Category management" title="Create category" description="Add a category to organize marketplace products." /><section className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-7"><div className="mb-6 border-b border-gray-200 pb-5 dark:border-gray-800"><h2 className="font-medium text-gray-800 dark:text-white/90">Category details</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Names are unique. Leading, trailing, and repeated whitespace is normalized by the backend.</p></div><CategoryForm apiError={error} onSubmit={submit} /><div className="mt-4 flex justify-end"><Button variant="outline" nativeButton={false} render={<Link to="/dashboard/admin/categories" />}>Cancel</Button></div></section></>;
}
