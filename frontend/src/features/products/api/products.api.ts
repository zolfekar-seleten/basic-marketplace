import { apiClient } from "@/api/client";
import type { CategoryOption, Product, ProductInput, ProductListParams, ProductListResponse } from "../types/product.types";

export async function listProductCategories(signal?: AbortSignal): Promise<CategoryOption[]> {
  const response = await apiClient.get<CategoryOption[]>("/categories/options", { signal });
  return response.data;
}

function toFormData(input: ProductInput): FormData {
  const data = new FormData();
  if (input.name !== undefined) data.append("name", input.name);
  if (input.description !== undefined) data.append("description", input.description);
  if (input.price !== undefined) data.append("price", input.price);
  if (input.stock !== undefined) data.append("stock", input.stock);
  if (input.categoryId !== undefined) data.append("categoryId", input.categoryId);
  if (input.isActive !== undefined) data.append("isActive", String(input.isActive));
  if (input.image) data.append("image", input.image);
  return data;
}

export async function listMyProducts(params: ProductListParams, signal?: AbortSignal): Promise<ProductListResponse> {
  const response = await apiClient.get<ProductListResponse>("/products/my", { params, signal });
  return response.data;
}

export async function listProducts(params: ProductListParams, signal?: AbortSignal): Promise<ProductListResponse> {
  const response = await apiClient.get<ProductListResponse>("/products", { params, signal });
  return response.data;
}

export async function getMyProduct(id: number, signal?: AbortSignal): Promise<Product> {
  const response = await apiClient.get<Product>(`/products/my/${id}`, { signal });
  return response.data;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const response = await apiClient.post<Product>("/products", toFormData(input), { headers: { "Content-Type": "multipart/form-data" } });
  return response.data;
}

export async function updateProduct(id: number, input: ProductInput): Promise<Product> {
  const response = await apiClient.patch<Product>(`/products/${id}`, toFormData(input), { headers: { "Content-Type": "multipart/form-data" } });
  return response.data;
}

export async function deleteProduct(id: number): Promise<void> {
  await apiClient.delete(`/products/${id}`);
}

export function productImageUrl(path: string | null): string | null {
  if (!path) return null;
  return new URL(path, import.meta.env.VITE_API_URL).toString();
}
