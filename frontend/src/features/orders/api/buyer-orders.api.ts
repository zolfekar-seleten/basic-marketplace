import { apiClient } from "@/api/client";
import type { BuyerOrder, BuyerOrderListParams, BuyerOrderListResponse } from "../types/buyer-order.types";

export async function listBuyerOrders(params: BuyerOrderListParams, signal?: AbortSignal): Promise<BuyerOrderListResponse> {
  const response = await apiClient.get<BuyerOrderListResponse>("/orders", { params, signal });
  return response.data;
}

export async function getBuyerOrder(id: number, signal?: AbortSignal): Promise<BuyerOrder> {
  const response = await apiClient.get<BuyerOrder>(`/orders/${id}`, { signal });
  return response.data;
}
