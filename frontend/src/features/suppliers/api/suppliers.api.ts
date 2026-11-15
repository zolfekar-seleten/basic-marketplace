import { apiClient } from "@/api/client";
import type {
  CreateSupplierInput,
  Supplier,
  SupplierListParams,
  SupplierListResponse,
  UpdateSupplierInput,
} from "../types/supplier.types";

export async function listSuppliers(
  params: SupplierListParams,
  signal?: AbortSignal,
): Promise<SupplierListResponse> {
  const response = await apiClient.get<SupplierListResponse>("/suppliers", {
    params,
    signal,
  });
  return response.data;
}

export async function getSupplier(
  id: number,
  signal?: AbortSignal,
): Promise<Supplier> {
  const response = await apiClient.get<Supplier>(`/suppliers/${id}`, { signal });
  return response.data;
}

export async function createSupplier(
  input: CreateSupplierInput,
): Promise<Supplier> {
  const response = await apiClient.post<Supplier>("/suppliers", input);
  return response.data;
}

export async function updateSupplier(
  id: number,
  input: UpdateSupplierInput,
): Promise<Supplier> {
  const response = await apiClient.patch<Supplier>(`/suppliers/${id}`, input);
  return response.data;
}

export async function activateSupplier(id: number): Promise<Supplier> {
  const response = await apiClient.patch<Supplier>(`/suppliers/${id}/activate`);
  return response.data;
}

export async function deactivateSupplier(id: number): Promise<Supplier> {
  const response = await apiClient.patch<Supplier>(`/suppliers/${id}/deactivate`);
  return response.data;
}
