import client from "./axiosClient";
import { normalizeProduct } from "./normalizers";
import type { Product, Review } from "../types";
export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  ids?: string;
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
const list = async (
  url: string,
  params: ProductQueryParams,
): Promise<ProductListResponse> => {
  const { data } = await client.get(url, { params });
  return { ...data, data: data.data.map(normalizeProduct) };
};
const payload = (data: Partial<Product>) => {
  const { id: _idAlias, _id, brandId, categoryId, version, ...rest } = data;
  void _idAlias;
  void _id;
  return {
    ...rest,
    ...(version !== undefined ? { expectedVersion: version } : {}),
    ...(brandId !== undefined ? { brand: brandId || null } : {}),
    ...(categoryId !== undefined ? { category: categoryId || null } : {}),
  };
};
const productApi = {
  createReview: async (id: string, review: { rating: number; title: string; content: string }) => {
    await client.post(`/products/${encodeURIComponent(id)}/reviews`, review);
  },
  getReviews: async (id: string): Promise<Review[]> => {
    const first = (
      await client.get(`/products/${encodeURIComponent(id)}/reviews`, {
        params: { limit: 100 },
      })
    ).data;
    const data = [...first.data];
    for (let page = 2; page <= first.pagination.totalPages; page++)
      data.push(
        ...(
          await client.get(`/products/${encodeURIComponent(id)}/reviews`, {
            params: { limit: 100, page },
          })
        ).data.data,
      );
    return data;
  },
  getAll: (params: ProductQueryParams = {}) => list("/products", params),
  getAdmin: (params: ProductQueryParams = {}) =>
    list("/products/admin/all", params),
  getById: async (id: string) =>
    normalizeProduct(
      (await client.get(`/products/${encodeURIComponent(id)}`)).data,
    ),
  create: async (data: Partial<Product>) =>
    normalizeProduct((await client.post("/products", payload(data))).data),
  update: async (id: string, data: Partial<Product>) =>
    normalizeProduct((await client.put(`/products/${id}`, payload(data))).data),
  delete: async (id: string): Promise<void> => {
    await client.delete(`/products/${id}`);
  },
};
export default productApi;
