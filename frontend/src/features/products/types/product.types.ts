export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  category: { id: number; name: string };
  supplier: { id: number; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductListParams {
  page: number;
  limit: number;
  search?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  sortBy?: "price" | "name" | "createdAt";
  sortOrder?: "ASC" | "DESC";
}

export interface ProductInput {
  name?: string;
  description?: string;
  price?: string;
  stock?: string;
  categoryId?: string;
  isActive?: boolean;
  image?: File | null;
}

export interface CategoryOption {
  id: number;
  name: string;
}
