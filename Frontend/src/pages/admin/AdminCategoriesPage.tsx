import { useEffect, useState, useCallback } from "react";
import { categoryApi } from "../../services/categoryApi";
import { brandApi } from "../../services/brandApi";
import { useCatalogStore } from "../../stores/useCatalogStore";
import { errorMessage } from "../../services/axiosClient";
import type { Category, Brand } from "../../types";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
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
  } | null>(null);
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
    void load();
  }, [load]);
  const save = async () => {
    if (!editing || busy) return;
    setBusy(true);
    try {
      if (editing._id) await api.update(editing._id, editing);
      else await api.create(editing);
      setEditing(null);
      await load();
      void useCatalogStore.getState().load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <h1 className="text-2xl font-bold">
        Quản lý {brands ? "thương hiệu" : "danh mục"}
      </h1>
      <Button
        className="mt-4"
        onClick={() =>
          setEditing({
            _id: "",
            name: "",
            slug: "",
            description: "",
            isActive: true,
          })
        }
      >
        Thêm mới
      </Button>
      {loading && <p>Đang tải...</p>}
      {error && (
        <p role="alert">
          {error} <button onClick={() => void load()}>Thử lại</button>
        </p>
      )}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <div key={r._id} className="rounded border bg-white p-5">
            <h2 className="font-bold">{r.name}</h2>
            <p>
              {r.slug} • {r.isActive ? "Đang hoạt động" : "Đã ẩn"}
            </p>
            <button
              className="mt-3 text-violet-600"
              onClick={() =>
                setEditing({
                  _id: r._id,
                  name: r.name,
                  slug: r.slug,
                  description: r.description || "",
                  isActive: r.isActive !== false,
                })
              }
            >
              Chỉnh sửa
            </button>
          </div>
        ))}
      </div>
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
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
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
            <Input
              required
              label="Slug"
              value={editing.slug}
              onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
            />
            <Input
              label="Mô tả"
              value={editing.description}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
            />
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
