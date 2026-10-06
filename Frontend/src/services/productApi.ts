import axiosClient from "./axiosClient";
import type { Product } from "../types";

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  availability?: "in-stock" | "out-of-stock";
  sortBy?: string;
  order?: "asc" | "desc";
}

export interface ProductListResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

const productApi = {
  getAll: (params: ProductQueryParams): Promise<ProductListResponse> => {
    const url = "/products";
    return axiosClient.get(url, { params });
  },

  getById: (id: string): Promise<Product> => {
    const url = `/products/${id}`;
    return axiosClient.get(url);
  },

  create: (data: Product): Promise<Product> => {
    const url = "/products";
    return axiosClient.post(url, data);
  },

  update: (id: string, data: Product): Promise<Product> => {
    const url = `/products/${id}`;
    return axiosClient.put(url, data);
  },

  delete: (id: string): Promise<void> => {
    const url = `/products/${id}`;
    return axiosClient.delete(url);
  },
};

export default productApi;
