export type OrderStatus = "pending" | "completed";

export interface SupplierOrderItem {
  productId: number;
  productName: string;
  unitPrice: string;
  quantity: number;
  subtotal: string;
}

export interface SupplierOrder {
  id: number;
  status: OrderStatus;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  buyer: { id: number; name: string; email: string };
  items: SupplierOrderItem[];
}

export interface SupplierOrdersResponse {
  data: SupplierOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SupplierOrdersParams {
  page: number;
  limit: number;
  status?: OrderStatus;
  sort: "newest" | "oldest";
}
