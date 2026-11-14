import client from "./axiosClient";
import type { Brand } from "../types";

export interface BrandQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}
export const brandApi = {
  getAll: async (params: BrandQueryParams = {}): Promise<Brand[]> => {
    const { data } = await client.get("/brands", { params });
    return data;
  },
  getById: async (id: string): Promise<Brand> => {
    const { data } = await client.get(`/brands/${id}`);
    return data;
  },
  create: async (input: Partial<Brand>): Promise<Brand> => {
    const { data } = await client.post("/brands", input);
    return data;
  },
  update: async (id: string, input: Partial<Brand>): Promise<Brand> => {
    const { data } = await client.put(`/brands/${id}`, input);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await client.delete(`/brands/${id}`);
  },
};
