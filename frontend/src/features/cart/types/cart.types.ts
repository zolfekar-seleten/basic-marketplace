export interface CartItem {
  id: number;
  product: {
    id: number;
    name: string;
    imageUrl: string | null;
    unitPrice: string;
    stock: number;
    isActive: boolean;
    available: boolean;
  };
  quantity: number;
  subtotal: string;
  availability: "available" | "inactive" | "insufficient_stock";
}

export interface Cart {
  id: number;
  items: CartItem[];
  total: string;
}
