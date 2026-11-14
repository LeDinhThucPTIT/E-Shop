import { useNavigate, Link } from "react-router-dom";
import { Scale, X, ShoppingCart } from "lucide-react";
import Container from "../../components/ui/Container";
import EmptyState from "../../components/ui/EmptyState";
import Rating from "../../components/ui/Rating";
import Button from "../../components/ui/Button";
import { useCompareStore } from "../../stores/useCompareStore";
import { useCartStore } from "../../stores/useCartStore";
import { getProductById, useCatalogStore } from "../../stores/useCatalogStore";
import { formatVND } from "../../utils/format";
import { useUIStore } from "../../stores/useUIStore";

export default function ComparePage() {
  const navigate = useNavigate();
  const { productIds, remove, clear } = useCompareStore();
  const { addItem } = useCartStore();
  const { showToast } = useUIStore();
  useCatalogStore((s) => s.products);

  if (productIds.length === 0) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={<Scale size={26} />}
          title="Chưa có sản phẩm để so sánh"
          description="Chọn tối đa 4 sản phẩm từ trang danh sách để so sánh chi tiết."
          actionLabel="Khám phá sản phẩm"
          onAction={() => navigate("/products")}
        />
      </Container>
    );
  }

  const items = productIds
    .map((id) => getProductById(id))
    .filter(Boolean) as ReturnType<typeof getProductById>[];

  const allSpecLabels = Array.from(
    new Set(items.flatMap((p) => p!.specifications.map((s) => s.label))),
  );

  const getSpec = (p: NonNullable<(typeof items)[number]>, label: string) =>
    p.specifications.find((s) => s.label === label)?.value || "—";

  const rows: {
    label: string;
    render: (p: NonNullable<(typeof items)[number]>) => React.ReactNode;
    highlight?: boolean;
  }[] = [
    {
      label: "Giá",
      render: (p) => (
        <span className="font-bold text-ink-900">{formatVND(p.price)}</span>
      ),
      highlight: true,
    },
    { label: "Thương hiệu", render: (p) => p.brand },
    {
      label: "Đánh giá",
      render: (p) => (
        <Rating value={p.rating} count={p.reviewCount} size={12} />
      ),
    },
    {
      label: "Tồn kho",
      render: (p) => (p.stock > 0 ? `Còn ${p.stock} sản phẩm` : "Hết hàng"),
    },
    { label: "Bảo hành", render: (p) => `${p.warrantyMonths} tháng` },
    ...allSpecLabels.map((label) => ({
      label,
      render: (p: NonNullable<(typeof items)[number]>) => getSpec(p, label),
    })),
  ];

  const isDifferent = (label: string) => {
    if (items.length < 2) return false;
    const values = items.map((p) =>
      JSON.stringify(rows.find((r) => r.label === label)?.render(p!)),
    );
    return new Set(values).size > 1;
  };

  return (
    <Container className="py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900">
          So sánh sản phẩm ({items.length}/4)
        </h1>
        <button
          onClick={clear}
          className="text-sm font-medium text-slate-500 hover:text-error-500"
        >
          Xóa tất cả
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <table className="w-full min-w-[640px] border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="w-40 p-3 text-left text-xs font-semibold uppercase text-slate-400"></th>
              {items.map((p) => (
                <th
                  key={p!.id}
                  className="min-w-[200px] border-l border-slate-100 p-3 text-left align-top"
                >
                  <div className="relative rounded-xl border border-slate-200/80 bg-slate-50/80 p-3">
                    <button
                      onClick={() => remove(p!.id)}
                      aria-label="Xóa khỏi so sánh"
                      className="absolute right-2 top-2 text-slate-400 hover:text-error-500"
                    >
                      <X size={15} />
                    </button>
                    <img
                      src={p!.images[0]}
                      alt={p!.name}
                      className="h-24 w-full rounded-sm object-cover"
                    />
                    <Link
                      to={`/products/${p!.slug}`}
                      className="mt-2 line-clamp-2 block text-sm font-semibold text-ink-900 hover:text-accent-600"
                    >
                      {p!.name}
                    </Link>
                    <Button
                      size="sm"
                      fullWidth
                      className="mt-2"
                      icon={<ShoppingCart size={13} />}
                      onClick={async () => {
                        if (
                          !(await addItem(
                            p!.id,
                            p!.variants[0]?.sku || p!.sku,
                            1,
                          ))
                        )
                          return;
                        showToast("Đã thêm vào giỏ hàng", "success");
                      }}
                    >
                      Thêm vào giỏ
                    </Button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="border-t border-slate-100 p-3 text-xs font-semibold text-slate-500">
                  {row.label}
                </td>
                {items.map((p) => (
                  <td
                    key={p!.id}
                    className={`border-l border-t border-slate-100 p-3 text-sm ${
                      isDifferent(row.label)
                        ? "bg-accent-50/40 font-medium text-accent-700"
                        : "text-slate-700"
                    }`}
                  >
                    {row.render(p!)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
