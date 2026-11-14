import { useEffect, useState, useCallback } from "react";
import { categoryApi } from "../../services/categoryApi";
import { brandApi } from "../../services/brandApi";
import { useCatalogStore } from "../../stores/useCatalogStore";
import { errorMessage } from "../../services/axiosClient";
import type { Category, Brand } from "../../types";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import { useUIStore } from "../../stores/useUIStore";
const slugify = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export default function AdminCategoriesPage({
  brands = false,
}: {
  brands?: boolean;
}) {
  const [rows, setRows] = useState<(Category | Brand)[]>([]);
  const [editing, setEditing] = useState<{
    _id: string;
    name: string;
    slug: string;
    description: string;
    isActive: boolean;
    image: string;
    sortOrder: number;
  } | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const { showToast } = useUIStore();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const api = brands ? brandApi : categoryApi;
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await api.getAll({}));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [api]);
  useEffect(() => {
    setEditing(null);
    setQuery("");
    setStatus("");
    void load();
  }, [load]);
  const save = async () => {
    if (!editing || busy) return;
    if (rows.some((r) => r._id !== editing._id && r.slug === editing.slug.trim())) {
      setError("Slug đã tồn tại. Vui lòng chọn đường dẫn khác.");
      return;
    }
    setBusy(true);
    try {
      if (editing._id) await api.update(editing._id, editing);
      else await api.create(editing);
      setEditing(null);
      await load();
      void useCatalogStore.getState().load();
      showToast("Đã lưu thay đổi", "success");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const filtered = rows.filter((r) => `${r.name} ${r.slug}`.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi")) && (!status || (status === "active" ? r.isActive !== false : r.isActive === false)));
  return (
    <div>
      <h1 className="text-2xl font-bold">
        Quản lý {brands ? "thương hiệu" : "danh mục"}
      </h1>
      <Button
        className="mt-4"
        onClick={() => {
          setError("");
          setSlugEdited(false);
          setEditing({
            _id: "",
            name: "",
            slug: "",
            description: "",
            isActive: true,
            image: "",
            sortOrder: 0,
          })
        }}
      >
        Thêm mới
      </Button>
      {!brands && <p className="mt-4 rounded-lg bg-violet-50 p-4 text-sm text-violet-700">Ẩn danh mục sẽ bỏ nhóm hàng khỏi trang danh mục và bộ lọc. Sản phẩm đang kinh doanh vẫn xuất hiện trong “Tất cả sản phẩm”. Số lượng bên dưới chỉ tính sản phẩm đang bán.</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        <div className="max-w-sm"><Input aria-label="Tìm kiếm" placeholder="Tìm theo tên hoặc slug..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <select aria-label="Trạng thái" className="rounded border p-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option><option value="active">Đang hiển thị</option><option value="hidden">Đã ẩn</option>
        </select>
      </div>
      {loading && <p>Đang tải...</p>}
      {error && (
        <p role="alert">
          {error} <button onClick={() => void load()}>Thử lại</button>
        </p>
      )}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!loading && !error && filtered.length === 0 && <p>{rows.length ? "Không có kết quả phù hợp với bộ lọc." : "Chưa có dữ liệu. Hãy thêm mới để bắt đầu."}</p>}
        {filtered.map((r) => (
          <div key={r._id} className="rounded border bg-white p-5">
            {!brands && "image" in r && r.image && <img src={r.image} alt="" className="mb-3 h-28 w-full object-contain" />}
            <h2 className="font-bold">{r.name}</h2>
            <p>
              {r.slug} • {r.isActive ? "Đang hoạt động" : "Đã ẩn"}
            </p>
            {!brands && <p className="mt-2 text-sm text-slate-500">{("productCount" in r ? r.productCount : 0) ?? 0} sản phẩm · Thứ tự {("sortOrder" in r ? r.sortOrder : 0) ?? 0}</p>}
            <button
              className="mt-3 text-violet-600"
              onClick={() => {
                setError("");
                setSlugEdited(true);
                setEditing({
                  _id: r._id,
                  name: r.name,
                  slug: r.slug,
                  description: r.description || "",
                  isActive: r.isActive !== false,
                  image: "image" in r ? r.image || "" : "",
                  sortOrder: "sortOrder" in r ? r.sortOrder || 0 : 0,
                })
              }}
            >
              Chỉnh sửa
            </button>
          </div>
        ))}
      </div>
      <Modal
        open={!!editing}
        onClose={() => { if (!busy) setEditing(null); }}
        title={brands ? "Thương hiệu" : "Danh mục"}
      >
        {editing && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <Input
              required
              label="Tên"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value, ...(!slugEdited ? { slug: slugify(e.target.value) } : {}) })}
            />
            <Input
              required
              label="Slug"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              value={editing.slug}
              onChange={(e) => { setSlugEdited(true); setEditing({ ...editing, slug: e.target.value }); }}
            />
            <Input
              label="Mô tả"
              value={editing.description}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
            />
            {!brands && <>
              <Input label="Ảnh đại diện (URL)" type="url" value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} />
              <Input label="Thứ tự hiển thị (số nhỏ đứng trước)" type="number" min={0} step={1} required value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} />
            </>}
            <label className="block">
              <input
                type="checkbox"
                checked={editing.isActive}
                onChange={(e) =>
                  setEditing({ ...editing, isActive: e.target.checked })
                }
              />{" "}
              Đang hoạt động
            </label>
            {error && <p role="alert">{error}</p>}
            <Button type="submit" loading={busy}>
              Lưu
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
