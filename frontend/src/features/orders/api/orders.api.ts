import { apiClient } from "@/api/client";
import type { CheckoutResponse } from "../types/checkout.types";

export async function checkout(): Promise<CheckoutResponse> {
  const response = await apiClient.post<CheckoutResponse>("/orders/checkout");
  return response.data;
}
