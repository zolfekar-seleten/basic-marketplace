import { apiClient } from "@/api/client";
import type { Cart } from "../types/cart.types";

export async function getCart(signal?: AbortSignal): Promise<Cart> {
  const response = await apiClient.get<Cart>("/cart", { signal });
  return response.data;
}

export async function addCartItem(productId: number, quantity = 1): Promise<Cart> {
  const response = await apiClient.post<Cart>("/cart/items", { productId, quantity });
  return response.data;
}

export async function updateCartItem(itemId: number, quantity: number): Promise<Cart> {
  const response = await apiClient.patch<Cart>(`/cart/items/${itemId}`, { quantity });
  return response.data;
}

export async function removeCartItem(itemId: number): Promise<Cart> {
  const response = await apiClient.delete<Cart>(`/cart/items/${itemId}`);
  return response.data;
}

export async function clearCart(): Promise<Cart> {
  const response = await apiClient.delete<Cart>("/cart");
  return response.data;
}
