import { useState } from "react";
import { Search } from "lucide-react";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";

const mockUsers = [
  { id: "u1", name: "Nguyễn Minh Anh", email: "minhanh@example.com", role: "Khách hàng", orders: 4 },
  { id: "u2", name: "Trần Quốc Bảo", email: "quocbao@example.com", role: "Khách hàng", orders: 1 },
  { id: "u3", name: "Admin NEURALSTORE", email: "admin@neuralstore.vn", role: "Quản trị viên", orders: 0 },
  { id: "u4", name: "Lê Thị Hà", email: "leha@example.com", role: "Khách hàng", orders: 7 },
  { id: "u5", name: "Phạm Đức Huy", email: "duchuy@example.com", role: "Khách hàng", orders: 2 },
];

export default function AdminUsersPage() {
  const [query, setQuery] = useState("");
  const filtered = mockUsers.filter(
    (u) => u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Quản lý người dùng</h1>
      <p className="mt-1 text-sm text-slate-500">Dữ liệu minh họa — không có xác thực thật</p>

      <div className="mt-5 max-w-sm">
        <Input icon={<Search size={15} />} placeholder="Tìm kiếm người dùng..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="mt-5 overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="border-b border-slate-100 text-left text-xs font-semibold uppercase text-slate-400">
            <tr>
              <th className="p-3">Tên</th>
              <th className="p-3">Email</th>
              <th className="p-3">Vai trò</th>
              <th className="p-3">Đơn hàng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((u) => (
              <tr key={u.id}>
                <td className="p-3 font-medium text-ink-900">{u.name}</td>
                <td className="p-3 text-slate-600">{u.email}</td>
                <td className="p-3">
                  <Badge variant={u.role === "Quản trị viên" ? "accent" : "default"}>{u.role}</Badge>
                </td>
                <td className="p-3 text-slate-600">{u.orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
