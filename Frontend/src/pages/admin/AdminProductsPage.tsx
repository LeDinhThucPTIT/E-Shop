import { useState } from "react";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { products as initialProducts } from "../../data/products";
import type { Product } from "../../types";
import { formatVND } from "../../utils/format";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { useUIStore } from "../../stores/useUIStore";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const { showToast } = useUIStore();

  const filtered = products.filter(
    (p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.brand.toLowerCase().includes(query.toLowerCase())
  );

  const handleSave = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditing(null);
    showToast("Đã cập nhật sản phẩm (chỉ áp dụng trong phiên này)", "success");
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    showToast("Đã xóa sản phẩm (chỉ áp dụng trong phiên này)", "info");
    setDeleteTarget(null);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Quản lý sản phẩm</h1>
          <p className="mt-1 text-sm text-slate-500">{products.length} sản phẩm</p>
        </div>
        <Button
          icon={<Plus size={16} />}
          onClick={() => showToast("Thêm sản phẩm chỉ mang tính minh họa frontend", "info")}
        >
          Thêm sản phẩm
        </Button>
      </div>

      <div className="mt-5 max-w-sm">
        <Input
          icon={<Search size={15} />}
          placeholder="Tìm kiếm sản phẩm..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="mt-5 overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-slate-100 text-left text-xs font-semibold uppercase text-slate-400">
            <tr>
              <th className="p-3">Sản phẩm</th>
              <th className="p-3">Danh mục</th>
              <th className="p-3">Giá</th>
              <th className="p-3">Tồn kho</th>
              <th className="p-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((p) => (
              <tr key={p.id}>
                <td className="flex items-center gap-3 p-3">
                  <img src={p.images[0]} alt="" className="h-9 w-9 rounded-sm object-cover" />
                  <span className="line-clamp-1 font-medium text-ink-900">{p.name}</span>
                </td>
                <td className="p-3 text-slate-600">{p.category}</td>
                <td className="p-3 font-medium text-ink-900">{formatVND(p.price)}</td>
                <td className="p-3">
                  {p.stock === 0 ? <Badge variant="error">Hết hàng</Badge> : <Badge variant="success">{p.stock}</Badge>}
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => setEditing(p)}
                      aria-label="Sửa"
                      className="rounded-sm p-1.5 text-slate-400 hover:bg-slate-100 hover:text-accent-600"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      aria-label="Xóa"
                      className="rounded-sm p-1.5 text-slate-400 hover:bg-error-50 hover:text-error-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Chỉnh sửa sản phẩm">
        {editing && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave(editing);
            }}
            className="space-y-4"
          >
            <Input
              label="Tên sản phẩm"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
            <Input
              label="Giá (₫)"
              type="number"
              value={editing.price}
              onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
            />
            <Input
              label="Tồn kho"
              type="number"
              value={editing.stock}
              onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })}
            />
            <Button type="submit" fullWidth>
              Lưu thay đổi
            </Button>
          </form>
        )}
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xóa sản phẩm">
        <p className="text-sm text-slate-600">
          Bạn có chắc muốn xóa "<span className="font-semibold">{deleteTarget?.name}</span>"? Thao tác này chỉ áp
          dụng trong phiên hiện tại.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Hủy</Button>
          <Button variant="danger" onClick={handleDelete}>Xóa</Button>
        </div>
      </Modal>
    </div>
  );
}
