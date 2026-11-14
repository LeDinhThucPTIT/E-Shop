import { useEffect, useState } from "react";
import { adminApi } from "../../services/adminApi";
import { errorMessage } from "../../services/axiosClient";
import { useAuthStore } from "../../stores/useAuthStore";
import type { User } from "../../types";
import Input from "../../components/ui/Input";
export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [query, setQuery] = useState("");
  const current = useAuthStore((s) => s.user);
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setUsers(await adminApi.users());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const update = async (user: User, data: Partial<User>) => {
    setBusy(user.id);
    setError("");
    try {
      const updated = await adminApi.updateUser(user.id, data);
      setUsers((rows) => rows.map((u) => (u.id === updated.id ? updated : u)));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy("");
    }
  };
  return (
    <div>
      <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
      <Input
        className="mt-5"
        placeholder="Tìm người dùng..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {loading && <p>Đang tải...</p>}
      {error && (
        <p role="alert">
          {error} <button onClick={() => void load()}>Thử lại</button>
        </p>
      )}
      <div className="mt-5 overflow-auto rounded border bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {["Họ tên", "Email", "Vai trò", "Trạng thái"].map((s) => (
                <th key={s} className="p-3">
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users
              .filter((u) =>
                (u.fullName + " " + u.email)
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
              .map((u) => (
                <tr key={u.id}>
                  <td className="p-3">{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      disabled={!!busy || u.id === current?.id}
                      onChange={(e) =>
                        void update(u, { role: e.target.value as User["role"] })
                      }
                    >
                      <option value="user">Khách hàng</option>
                      <option value="admin">Quản trị viên</option>
                    </select>
                  </td>
                  <td>
                    <button
                      disabled={!!busy || u.id === current?.id}
                      onClick={() => void update(u, { isActive: !u.isActive })}
                    >
                      {u.isActive
                        ? "Đang hoạt động — Khóa"
                        : "Đã khóa — Mở khóa"}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
