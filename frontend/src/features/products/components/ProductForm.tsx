import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { CategoryOption } from "../types/product.types";
import { productImageUrl } from "../api/products.api";

const schema = z.object({
  name: z.string().trim().min(1, "Enter a product name.").max(150, "Use 150 characters or fewer."),
  description: z.string(),
  price: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Enter a positive price with up to two decimal places.").refine((value) => Number(value) > 0, "Price must be greater than zero."),
  stock: z.string().trim().regex(/^\d+$/, "Stock must be a whole number of zero or more."),
  categoryId: z.string().regex(/^[1-9]\d*$/, "Select a category."),
  isActive: z.boolean(),
});

export interface ProductFormValues { name: string; description: string; price: string; stock: string; categoryId: string; isActive: boolean; }
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

async function validateImage(file: File): Promise<string | null> {
  if (file.size === 0 || file.size > MAX_IMAGE_SIZE) return "Choose a non-empty image no larger than 5 MB.";
  const signature = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const jpeg = file.type === "image/jpeg" && signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff;
  const png = file.type === "image/png" && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => signature[index] === byte);
  const webp = file.type === "image/webp" && String.fromCharCode(...signature.slice(0, 4)) === "RIFF" && String.fromCharCode(...signature.slice(8, 12)) === "WEBP";
  return jpeg || png || webp ? null : "Choose a valid JPEG, PNG, or WebP image.";
}

export function ProductForm({ categories, initialValues, currentImage, apiError, submitLabel, onSubmit }: {
  categories: CategoryOption[];
  initialValues?: Partial<ProductFormValues>;
  currentImage?: string | null;
  apiError: string | null;
  submitLabel: string;
  onSubmit: (values: ProductFormValues, image: File | null) => Promise<void>;
}) {
  const [image, setImage] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!image) { setPreview(null); return; }
    const url = URL.createObjectURL(image); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: initialValues?.name ?? "", description: initialValues?.description ?? "", price: initialValues?.price ?? "", stock: initialValues?.stock ?? "0", categoryId: initialValues?.categoryId ?? "", isActive: initialValues?.isActive ?? true },
  });
  const handleImage = async (file?: File) => {
    setImageError(null); setImage(null);
    if (!file) return;
    const message = await validateImage(file);
    if (message) { setImageError(message); return; }
    setImage(file);
  };
  const submit = handleSubmit(async (values) => {
    if (image) {
      const message = await validateImage(image);
      if (message) { setImageError(message); return; }
    }
    await onSubmit(values, image);
  });

  return <form className="space-y-5" onSubmit={submit} noValidate>
    <div><label htmlFor="product-name" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Product name</label><Input id="product-name" maxLength={150} aria-invalid={Boolean(errors.name)} {...register("name")} />{errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>}</div>
    <div><label htmlFor="product-description" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label><textarea id="product-description" rows={4} className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 outline-hidden placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90" {...register("description")} />{errors.description && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>}</div>
    <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="product-price" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Price</label><Input id="product-price" type="number" min="0.01" step="0.01" inputMode="decimal" aria-invalid={Boolean(errors.price)} {...register("price")} />{errors.price && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.price.message}</p>}</div><div><label htmlFor="product-stock" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Stock quantity</label><Input id="product-stock" type="number" min="0" step="1" inputMode="numeric" aria-invalid={Boolean(errors.stock)} {...register("stock")} />{errors.stock && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.stock.message}</p>}</div></div>
    <div><label htmlFor="product-category" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label><select id="product-category" className="h-11 w-full rounded-[10px] border border-gray-300 bg-white px-4 text-sm text-gray-800 outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" {...register("categoryId")}><option value="">Select a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>{errors.categoryId && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.categoryId.message}</p>}</div>
    <div><label htmlFor="product-image" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Product image <span className="font-normal text-gray-400 dark:text-gray-400">(JPEG, PNG, WebP; up to 5 MB)</span></label><input id="product-image" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full rounded-lg border border-gray-300 bg-white text-sm text-gray-600 file:me-4 file:border-0 file:bg-gray-100 file:px-4 file:py-3 file:font-medium dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:file:bg-gray-800" onChange={(event) => void handleImage(event.target.files?.[0])} />{imageError && <p role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">{imageError}</p>}{(preview || currentImage) && <div className="mt-3"><p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{preview ? "New image preview" : "Current image"}</p><img src={preview ?? productImageUrl(currentImage ?? null) ?? undefined} alt="Product preview" className="h-40 w-40 rounded-xl border border-gray-200 object-cover dark:border-gray-800" />{preview && <button type="button" className="mt-2 text-sm text-gray-500 underline dark:text-gray-400" onClick={() => { setImage(null); setImageError(null); }}>Keep current image</button>}</div>}</div>
    <div className="flex items-center gap-3"><input id="product-active" type="checkbox" className="size-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700" {...register("isActive")} /><label htmlFor="product-active" className="text-sm font-medium text-gray-700 dark:text-gray-300">Product is active and visible in the marketplace</label></div>
    {apiError && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">{apiError}</p>}
    <div className="flex justify-end border-t border-gray-200 pt-5 dark:border-gray-800"><Button type="submit" disabled={isSubmitting || Boolean(imageError) || categories.length === 0}>{isSubmitting ? "Saving…" : submitLabel}</Button></div>
  </form>;
}
