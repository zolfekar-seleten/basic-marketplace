import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(1, "Enter a category name.").max(100, "Use 100 characters or fewer."),
  description: z.string().trim(),
});

export interface CategoryFormValues {
  name: string;
  description: string;
}

export function CategoryForm({
  initialValues,
  apiError,
  onSubmit,
}: {
  initialValues?: Partial<CategoryFormValues>;
  apiError: string | null;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CategoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: initialValues?.name ?? "", description: initialValues?.description ?? "" },
  });

  return <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
    <div>
      <label htmlFor="category-name" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Category name</label>
      <Input id="category-name" autoComplete="off" maxLength={100} aria-invalid={Boolean(errors.name)} {...register("name")} />
      {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
    </div>
    <div>
      <label htmlFor="category-description" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Description <span className="font-normal text-gray-400">(optional)</span></label>
      <textarea id="category-description" rows={4} className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 outline-hidden placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90 dark:placeholder:text-white/30" {...register("description")} />
    </div>
    {apiError && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">{apiError}</p>}
    <div className="flex justify-end border-t border-gray-200 pt-5 dark:border-gray-800"><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save category"}</Button></div>
  </form>;
}
