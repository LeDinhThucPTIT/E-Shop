import client from "./axiosClient";
import type { User } from "../types";
export const adminApi = {
  users: async (search = ""): Promise<User[]> => {
    const first = (
      await client.get("/users", { params: { search, limit: 100 } })
    ).data;
    const data = [...first.data];
    for (let page = 2; page <= first.pagination.totalPages; page++)
      data.push(
        ...(
          await client.get("/users", { params: { search, page, limit: 100 } })
        ).data.data,
      );
    return data;
  },
  updateUser: async (id: string, input: Partial<User>): Promise<User> =>
    (await client.put(`/users/${id}`, input)).data,
  stats: async () => (await client.get("/orders/admin/stats")).data,
};
