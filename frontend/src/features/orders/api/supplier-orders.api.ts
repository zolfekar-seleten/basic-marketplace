import { apiClient } from "@/api/client";
import type { OrderStatus, SupplierOrder, SupplierOrdersParams, SupplierOrdersResponse } from "../types/supplier-order.types";

export async function listSupplierOrders(params: SupplierOrdersParams, signal?: AbortSignal): Promise<SupplierOrdersResponse> {
  const response = await apiClient.get<SupplierOrdersResponse>("/supplier/orders", { params, signal });
  return response.data;
}

export async function getSupplierOrder(id: number, signal?: AbortSignal): Promise<SupplierOrder> {
  const response = await apiClient.get<SupplierOrder>(`/supplier/orders/${id}`, { signal });
  return response.data;
}

export async function completeSupplierOrder(id: number): Promise<SupplierOrder> {
  const response = await apiClient.patch<SupplierOrder>(`/supplier/orders/${id}/status`, { status: "completed" satisfies OrderStatus });
  return response.data;
}
