export interface Category {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
}

export interface CategoryInput {
  name: string;
  description?: string | null;
}
