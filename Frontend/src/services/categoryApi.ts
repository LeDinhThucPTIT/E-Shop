import axiosClient from "./axiosClient";

import type { Category } from "../types";

export interface CategoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export const categoryApi = {
  getAll: (params: CategoryQueryParams): Promise<Category[]> => {
    const url = "/categories";
    return axiosClient.get(url, { params });
  },
  getById: (id: string): Promise<Category> => {
    const url = `/categories/${id}`;
    return axiosClient.get(url);
  },
  create: (data: Category): Promise<Category> => {
    const url = "/categories";
    return axiosClient.post(url, data);
  },
  update: (id: string, data: Category): Promise<Category> => {
    const url = `/categories/${id}`;
    return axiosClient.put(url, data);
  },
  delete: (id: string): Promise<void> => {
    const url = `/categories/${id}`;
    return axiosClient.delete(url);
  },
};
