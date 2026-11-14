import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Grid3x3, Search } from "lucide-react";
import { categoryApi } from "../../services/categoryApi";
import type { Category } from "../../types";
import Container from "../../components/ui/Container";
import Breadcrumb from "../../components/ui/Breadcrumb";
import Input from "../../components/ui/Input";
import EmptyState from "../../components/ui/EmptyState";
import Skeleton from "../../components/ui/Skeleton";

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    categoryApi.getAll({ isActive: true }).then((rows) => {
      if (active) setCategories(rows);
    }).catch(() => {
      if (active) setError(true);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [attempt]);
  const filtered = categories.filter((c) =>
    `${c.name} ${c.description || ""}`.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi")),
  );
  return (
    <Container className="py-8">
      <Breadcrumb items={[{ label: "Danh mục" }]} />
      <div className="my-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="text-3xl font-bold text-ink-900">Khám phá danh mục</h1>
          <p className="mt-2 text-sm text-slate-500">Chọn nhóm hàng phù hợp để tìm sản phẩm bạn cần.</p>
        </div>
        <Link to="/products" className="flex items-center gap-2 text-sm font-semibold text-violet-600">Tất cả sản phẩm <ArrowRight size={16} /></Link>
      </div>
      <div className="mb-6 max-w-md">
        <Input aria-label="Tìm danh mục" icon={<Search size={16} />} placeholder="Tìm danh mục..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-64 w-full" />)}</div>
      ) : error ? (
        <EmptyState icon={<Grid3x3 size={26} />} title="Không thể tải danh mục" description="Vui lòng thử tải lại danh sách." actionLabel="Thử lại" onAction={() => setAttempt((n) => n + 1)} />
      ) : !filtered.length ? (
        <EmptyState icon={<Grid3x3 size={26} />} title={query ? "Không tìm thấy danh mục" : "Chưa có danh mục"} description={query ? "Thử tên nhóm hàng khác hoặc xóa từ khóa." : "Bạn vẫn có thể khám phá toàn bộ sản phẩm."} actionLabel={query ? "Xóa tìm kiếm" : "Xem sản phẩm"} onAction={() => query ? setQuery("") : navigate("/products")} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Link key={c._id} to={`/products?${new URLSearchParams({ category: c.slug })}`} className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-lg">
              <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-violet-50 to-slate-100">
                <Grid3x3 size={40} className="text-violet-400" />
                {c.image && <img src={c.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full bg-slate-50 object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
              </div>
              <div className="p-5">
                <h2 className="text-lg font-bold text-ink-900">{c.name}</h2>
                {c.productCount !== undefined && <p className="mt-1 text-xs text-violet-600">{c.productCount} sản phẩm đang bán</p>}
                <p className="mt-2 text-sm text-slate-500">{c.description || `Khám phá các sản phẩm thuộc nhóm ${c.name}.`}</p>
                <span className="mt-4 flex items-center gap-2 text-sm font-semibold text-violet-600">Xem sản phẩm <ArrowRight size={15} /></span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
