export interface CheckoutOrderItem {
  productId: number;
  productName: string;
  unitPrice: string;
  quantity: number;
  subtotal: string;
}

export interface CheckoutOrder {
  id: number;
  supplier: {
    id: number;
    name: string;
  };
  status: "pending" | "completed";
  totalAmount: string;
  items: CheckoutOrderItem[];
}

export interface CheckoutResponse {
  message: string;
  orders: CheckoutOrder[];
}
