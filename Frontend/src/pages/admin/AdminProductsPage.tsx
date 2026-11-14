import { brandApi } from "../../services/brandApi";
import { useEffect, useState } from "react";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import productApi from "../../services/productApi";
import { errorMessage } from "../../services/axiosClient";
import { normalizeProduct } from "../../services/normalizers";
import { useCatalogStore } from "../../stores/useCatalogStore";
import type { Product } from "../../types";
import { formatVND } from "../../utils/format";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { useUIStore } from "../../stores/useUIStore";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const { categories } = useCatalogStore();
  const [brands, setBrands] = useState<import("../../types").Brand[]>([]);
  const { showToast } = useUIStore();

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const first = await productApi.getAdmin({ limit: 100 });
      const rows = [...first.data];
      for (let page = 2; page <= first.pagination.totalPages; page++)
        rows.push(...(await productApi.getAdmin({ page, limit: 100 })).data);
      setProducts(rows);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
    void brandApi
      .getAll({ isActive: true })
      .then(setBrands)
      .catch((e) => setError(errorMessage(e)));
  }, []);
  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.brand.toLowerCase().includes(query.toLowerCase()),
  );

  const handleSave = async (updated: Product) => {
    if (busy) return;
    setBusy(true);
    try {
      const payload = {
        version: updated.version,
        name: updated.name,
        slug: updated.slug,
        price: updated.basePrice,
        discountPrice: updated.discountPrice ?? null,
        stock: updated.stock,
        description: updated.description,
        images: updated.images,
        isActive: updated.isActive,
        categoryId: updated.categoryId,
        brandId: updated.brandId,
        variants: updated.variants,
      };
      if (updated.id) await productApi.update(updated.id, payload);
      else await productApi.create(payload);
      setEditing(null);
      await load();
      void useCatalogStore.getState().load();
      showToast("Đã lưu sản phẩm", "success");
    } catch (e) {
      showToast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };
  const handleDelete = async () => {
    if (!deleteTarget || busy) return;
    setBusy(true);
    try {
      await productApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      await load();
      void useCatalogStore.getState().load();
      showToast("Đã ngừng kinh doanh sản phẩm", "info");
    } catch (e) {
      showToast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Quản lý sản phẩm</h1>
          <p className="mt-1 text-sm text-slate-500">
            {products.length} sản phẩm
          </p>
        </div>
        <Button
          icon={<Plus size={16} />}
          onClick={() =>
            setEditing(
              normalizeProduct({
                _id: "",
                name: "",
                slug: "",
                price: 0,
                stock: 0,
                isActive: true,
              }),
            )
          }
        >
          Thêm sản phẩm
        </Button>
      </div>

      {loading && <p className="mt-4">Đang tải...</p>}
      {error && (
        <p role="alert">
          {error} <button onClick={() => void load()}>Thử lại</button>
        </p>
      )}
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
                  <img
                    src={p.images[0]}
                    alt=""
                    className="h-9 w-9 rounded-sm object-cover"
                  />
                  <span className="line-clamp-1 font-medium text-ink-900">
                    {p.name}
                  </span>
                </td>
                <td className="p-3 text-slate-600">{p.category}</td>
                <td className="p-3 font-medium text-ink-900">
                  {formatVND(p.price)}
                </td>
                <td className="p-3">
                  {p.stock === 0 ? (
                    <Badge variant="error">Hết hàng</Badge>
                  ) : (
                    <Badge variant="success">{p.stock}</Badge>
                  )}
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

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Chỉnh sửa sản phẩm"
      >
        {editing && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave(editing);
            }}
            className="space-y-4"
          >
            <Input
              required
              label="Tên sản phẩm"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
            <Input
              required
              label="Đường dẫn (slug)"
              value={editing.slug}
              onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
            />
            <label className="block text-sm">
              Danh mục
              <select
                className="ml-2 rounded border p-2"
                value={editing.categoryId}
                onChange={(e) =>
                  setEditing({ ...editing, categoryId: e.target.value })
                }
              >
                <option value="">Chưa chọn</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Thương hiệu
              <select
                className="ml-2 rounded border p-2"
                value={editing.brandId}
                onChange={(e) =>
                  setEditing({ ...editing, brandId: e.target.value })
                }
              >
                <option value="">Chưa chọn</option>
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <input
                type="checkbox"
                checked={editing.isActive}
                onChange={(e) =>
                  setEditing({ ...editing, isActive: e.target.checked })
                }
              />{" "}
              Đang kinh doanh
            </label>
            <Input
              label="Ảnh (URL)"
              value={
                editing.images[0] === "/favicon.svg" ? "" : editing.images[0]
              }
              onChange={(e) =>
                setEditing({ ...editing, images: [e.target.value] })
              }
            />
            <Input
              label="Giá (₫)"
              min={0}
              step={1}
              required
              type="number"
              value={editing.basePrice}
              onChange={(e) =>
                setEditing({ ...editing, basePrice: Number(e.target.value) })
              }
            />
            <Input
              label="Giá khuyến mãi (để trống nếu không có)"
              type="number"
              min={0}
              step={1}
              value={editing.discountPrice ?? ""}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  discountPrice:
                    e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
            <Input
              disabled={editing.variants.length > 0}
              label="Tồn kho"
              min={0}
              step={1}
              required
              type="number"
              value={editing.stock}
              onChange={(e) =>
                setEditing({ ...editing, stock: Number(e.target.value) })
              }
            />
            {editing.variants.map((v, index) => (
              <div key={index} className="space-y-2 rounded border p-3">
                <Input
                  required
                  label="SKU"
                  value={v.sku}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      variants: editing.variants.map((r, i) =>
                        i === index ? { ...r, sku: e.target.value } : r,
                      ),
                    })
                  }
                />
                <Input
                  required
                  min={0}
                  step={1}
                  type="number"
                  label="Giá phiên bản"
                  value={v.price}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      variants: editing.variants.map((r, i) =>
                        i === index
                          ? { ...r, price: Number(e.target.value) }
                          : r,
                      ),
                    })
                  }
                />
                <Input
                  required
                  min={0}
                  step={1}
                  type="number"
                  label="Tồn kho phiên bản"
                  value={v.stock}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      variants: editing.variants.map((r, i) =>
                        i === index
                          ? { ...r, stock: Number(e.target.value) }
                          : r,
                      ),
                    })
                  }
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setEditing({
                  ...editing,
                  variants: [
                    ...editing.variants,
                    { sku: "", price: editing.price, stock: 0 },
                  ],
                })
              }
            >
              Thêm phiên bản
            </Button>
            <Button type="submit" fullWidth loading={busy}>
              Lưu thay đổi
            </Button>
          </form>
        )}
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Xóa sản phẩm"
      >
        <p className="text-sm text-slate-600">
          Bạn có chắc muốn xóa "
          <span className="font-semibold">{deleteTarget?.name}</span>"? Sản phẩm
          sẽ được ngừng kinh doanh; lịch sử đơn hàng vẫn được giữ.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            Hủy
          </Button>
          <Button variant="danger" loading={busy} onClick={handleDelete}>
            Xóa
          </Button>
        </div>
      </Modal>
    </div>
  );
}
