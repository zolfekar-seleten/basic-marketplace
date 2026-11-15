import { apiClient } from "@/api/client";
import type { Category, CategoryInput } from "../types/category.types";

export async function listCategories(signal?: AbortSignal): Promise<Category[]> {
  const response = await apiClient.get<Category[]>("/categories", { signal });
  return response.data;
}

export async function getCategory(id: number, signal?: AbortSignal): Promise<Category> {
  const response = await apiClient.get<Category>(`/categories/${id}`, { signal });
  return response.data;
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const response = await apiClient.post<Category>("/categories", input);
  return response.data;
}

export async function updateCategory(id: number, input: CategoryInput): Promise<Category> {
  const response = await apiClient.patch<Category>(`/categories/${id}`, input);
  return response.data;
}

export async function deleteCategory(id: number): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}
