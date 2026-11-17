export type BuyerOrderStatus = "pending" | "completed";

export interface BuyerOrderItem {
  productId: number;
  productName: string;
  unitPrice: string;
  quantity: number;
  subtotal: string;
}

export interface BuyerOrder {
  id: number;
  status: BuyerOrderStatus;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  supplier: {
    id: number;
    name: string;
  };
  items: BuyerOrderItem[];
}

export interface BuyerOrderListResponse {
  data: BuyerOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BuyerOrderListParams {
  page: number;
  limit: number;
  status?: BuyerOrderStatus;
  sort?: "newest" | "oldest";
}
