import axiosClient from "./axiosClient";
import type { Brand } from "../types";
export interface BrandQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export const brandApi = {
  getAll: (params: BrandQueryParams): Promise<Brand[]> => {
    const url = "/brands";
    return axiosClient.get(url, { params });
  },
  getById: (id: string): Promise<Brand> => {
    const url = `/brands/${id}`;
    return axiosClient.get(url);
  },
  create: (data: Brand): Promise<Brand> => {
    const url = "/brands";
    return axiosClient.post(url, data);
  },
  update: (id: string, data: Brand): Promise<Brand> => {
    const url = `/brands/${id}`;
    return axiosClient.put(url, data);
  },
  delete: (id: string): Promise<void> => {
    const url = `/brands/${id}`;
    return axiosClient.delete(url);
  },
};
