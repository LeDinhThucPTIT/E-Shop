import client from "./axiosClient";
import type { Category } from "../types";
import { normalizeCategory } from "./normalizers";
export interface CategoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}
export const categoryApi = {
  getAll: async (params: CategoryQueryParams = {}): Promise<Category[]> => {
    const { data } = await client.get("/categories", { params });
    return data.map(normalizeCategory);
  },
  getById: async (id: string): Promise<Category> => {
    const { data } = await client.get(`/categories/${id}`);
    return normalizeCategory(data);
  },
  create: async (input: Partial<Category>): Promise<Category> => {
    const { data } = await client.post("/categories", input);
    return normalizeCategory(data);
  },
  update: async (id: string, input: Partial<Category>): Promise<Category> => {
    const { data } = await client.put(`/categories/${id}`, input);
    return normalizeCategory(data);
  },
  delete: async (id: string): Promise<void> => {
    await client.delete(`/categories/${id}`);
  },
};
