import { categories } from "../../data/categories";
import { products } from "../../data/products";

export default function AdminCategoriesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Quản lý danh mục</h1>
      <p className="mt-1 text-sm text-slate-500">{categories.length} danh mục</p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => {
          const count = products.filter((p) => p.category === c.slug).length;
          return (
            <div key={c.id} className="rounded-md border border-slate-200 bg-white p-5">
              <p className="text-base font-semibold text-ink-900">{c.name}</p>
              <p className="mt-1 text-xs text-slate-500">{count} sản phẩm</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
