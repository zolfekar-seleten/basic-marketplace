export interface Supplier {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierListResponse {
  data: Supplier[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SupplierListParams {
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateSupplierInput {
  name: string;
  email: string;
  password: string;
}

export interface UpdateSupplierInput {
  name: string;
  email: string;
}
