import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  Laptop,
  Smartphone,
  Cpu,
  MemoryStick,
  Watch,
  Headphones,
  Home as HomeIcon,
  Keyboard,
  ShieldCheck,
  Truck,
  RotateCcw,
  HeadphonesIcon,
  Send,
} from "lucide-react";
import { useState } from "react";
import Container from "../../components/ui/Container";
import Button from "../../components/ui/Button";
import ProductCard from "../../components/product/ProductCard";
import { useCatalogStore } from "../../stores/useCatalogStore";

import { useUIStore } from "../../stores/useUIStore";

const categoryIcons: Record<string, React.ElementType> = {
  Laptop,
  Smartphone,
  Cpu,
  MemoryStick,
  Watch,
  Headphones,
  Home: HomeIcon,
  Keyboard,
};

export default function HomePage() {
  const { products, categories, loading, error, load } = useCatalogStore();
  const trending = products.filter((p) => p.trending).slice(0, 8);
  const featured = products.filter((p) => p.featured).slice(0, 4);
  const recommended = products.slice(0, 8);
  const { showToast } = useUIStore();
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      showToast("Vui lòng nhập email hợp lệ", "error");
      return;
    }
    showToast(
      "Đăng ký thành công! Cảm ơn bạn đã theo dõi NEURALSTORE.",
      "success",
    );
    setEmail("");
  };

  return (
    <div className="animate-fadeIn">
      {loading && <p className="p-4 text-center">Đang tải sản phẩm...</p>}
      {error && (
        <div role="alert" className="p-4 text-center text-red-600">
          {error} <button onClick={() => void load()}>Thử lại</button>
        </div>
      )}
      {/* Hero */}
      <section className="relative border-b border-slate-200/80 bg-gradient-to-b from-white via-indigo-50/20 to-[#F1F4F9] overflow-hidden">
        <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-violet-200/25 to-accent-200/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gradient-to-tr from-cyan-200/20 to-violet-200/10 blur-3xl" />
        <Container className="grid grid-cols-1 items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div className="animate-slideUp">
            <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-100 to-accent-100 px-3 py-1.5 text-xs font-semibold text-violet-700">
              <Sparkles size={13} /> Được hỗ trợ bởi AI
            </span>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-ink-900 sm:text-5xl lg:text-6xl">
              Tìm công nghệ
              <br />
              phù hợp với bạn.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-slate-500 sm:text-lg">
              Mua sắm thông minh hơn với gợi ý AI được thiết kế riêng theo nhu
              cầu, ngân sách và công việc của bạn.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products">
                <Button
                  size="lg"
                  icon={<ArrowRight size={18} />}
                  className="flex-row-reverse"
                >
                  Khám phá sản phẩm
                </Button>
              </Link>
              <Link to="/ai-assistant">
                <Button
                  size="lg"
                  variant="outline"
                  icon={<Sparkles size={18} />}
                >
                  Hỏi trợ lý AI
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-8">
              <div>
                <p className="text-2xl font-bold text-ink-900">25+</p>
                <p className="text-xs text-slate-500">Sản phẩm tuyển chọn</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-ink-900">4.7/5</p>
                <p className="text-xs text-slate-500">Đánh giá trung bình</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-ink-900">24/7</p>
                <p className="text-xs text-slate-500">Trợ lý AI hỗ trợ</p>
              </div>
            </div>
          </div>
          <div className="relative animate-scaleIn">
            <div className="absolute -inset-6 -z-10 rounded-full bg-gradient-to-br from-violet-300/40 via-accent-200/30 to-cyan-300/20 blur-3xl animate-pulse-glow" />
            <div className="grid grid-cols-2 gap-4">
              <img
                src={products[0]?.images[0] || "/favicon.svg"}
                alt={products[0]?.name || "NEURALSTORE"}
                className="col-span-2 h-56 w-full rounded-lg object-cover shadow-lg sm:h-64"
              />
              <img
                src={products[5]?.images[0] || "/favicon.svg"}
                alt={products[5]?.name || "NEURALSTORE"}
                className="h-32 w-full rounded-lg object-cover shadow-md sm:h-40"
              />
              <img
                src={products[13]?.images[0] || "/favicon.svg"}
                alt={products[13]?.name || "NEURALSTORE"}
                className="h-32 w-full rounded-lg object-cover shadow-md sm:h-40"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Categories */}
      <section className="py-14">
        <Container>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-ink-900 sm:text-3xl">
                Danh mục nổi bật
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Khám phá theo nhu cầu công nghệ của bạn
              </p>
            </div>
            <Link
              to="/products"
              className="hidden text-sm font-semibold text-accent-600 hover:underline sm:block"
            >
              Xem tất cả
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat) => {
              const Icon = categoryIcons[cat.icon || "Laptop"] || Laptop;
              return (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.slug}`}
                  className="group flex flex-col items-center gap-3 rounded-lg border border-slate-200/80 bg-white p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-100/50"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-slate-50 to-slate-100 text-slate-600 transition-all duration-300 group-hover:from-violet-100 group-hover:to-accent-100 group-hover:text-violet-600 group-hover:shadow-md group-hover:shadow-violet-200/50">
                    <Icon size={22} />
                  </div>
                  <span className="text-sm font-semibold text-ink-900">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Trending */}
      <section className="py-14">
        <Container>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-ink-900 sm:text-3xl">
                Sản phẩm xu hướng
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Được yêu thích nhất tuần này
              </p>
            </div>
            <Link
              to="/products?sort=trending"
              className="hidden text-sm font-semibold text-accent-600 hover:underline sm:block"
            >
              Xem tất cả
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {trending.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Container>
      </section>

      {/* AI Assistant Section */}
      <section className="py-14">
        <Container>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ink-950 via-violet-950/80 to-ink-900 px-6 py-12 text-white sm:px-12 sm:py-16">
            <div className="absolute top-10 right-10 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl animate-pulse-glow" />
            <div className="absolute bottom-10 left-10 h-24 w-24 rounded-full bg-cyan-500/10 blur-2xl animate-float" />
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
              <div>
                <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-500/20 to-cyan-500/20 px-3 py-1.5 text-xs font-semibold text-cyan-300">
                  <Sparkles size={13} /> Trợ lý mua sắm AI
                </span>
                <h2 className="text-2xl font-bold leading-tight sm:text-3xl">
                  Không biết chọn gì? Hỏi trợ lý AI của chúng tôi.
                </h2>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
                  Mô tả nhu cầu, ngân sách và mục đích sử dụng — AI sẽ phân tích
                  và gợi ý những sản phẩm phù hợp nhất trong vài giây.
                </p>
                <Link to="/ai-assistant">
                  <Button
                    size="lg"
                    className="mt-6"
                    icon={<ArrowRight size={18} />}
                    style={{ flexDirection: "row-reverse" }}
                  >
                    Trò chuyện với AI
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {[
                  "Tìm laptop lập trình dưới 30 triệu VND",
                  "GPU nào tốt nhất để phát triển AI?",
                  "Tôi có 20 triệu VND, nên mua gì?",
                ].map((prompt) => (
                  <div
                    key={prompt}
                    className="rounded-md border border-violet-400/10 bg-white/5 px-4 py-3 text-sm text-slate-200 hover:bg-violet-500/10 hover:border-violet-400/20 transition-colors cursor-pointer"
                  >
                    "{prompt}"
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Recommended */}
      <section className="py-14">
        <Container>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-ink-900 sm:text-3xl">
              Gợi ý dành cho bạn
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Dựa trên các sản phẩm phổ biến trên NEURALSTORE
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {recommended.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Container>
      </section>

      {/* Promo Banner */}
      <section className="py-4">
        <Container>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-accent-500 via-violet-500 to-accent-600 px-8 py-8 text-white shadow-lg shadow-violet-500/20">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent-100">
                  Ưu đãi có hạn
                </p>
                <h3 className="mt-1 text-xl font-bold">
                  Giảm đến 20% Laptop AI
                </h3>
                <Link
                  to="/products?category=laptop"
                  className="mt-3 inline-flex text-sm font-semibold underline"
                >
                  Mua ngay
                </Link>
              </div>
              <Laptop size={56} className="opacity-30" />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-ink-900 via-violet-900/50 to-ink-800 px-8 py-8 text-white shadow-lg">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Mới ra mắt
                </p>
                <h3 className="mt-1 text-xl font-bold">
                  GPU thế hệ mới cho AI
                </h3>
                <Link
                  to="/products?category=gpu"
                  className="mt-3 inline-flex text-sm font-semibold underline"
                >
                  Khám phá
                </Link>
              </div>
              <Cpu size={56} className="opacity-30" />
            </div>
          </div>
        </Container>
      </section>

      {/* Why NEURALSTORE */}
      <section className="py-14">
        <Container>
          <h2 className="mb-8 text-2xl font-bold text-ink-900 sm:text-3xl">
            Vì sao chọn NEURALSTORE
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Container>
      </section>

      {/* Benefits */}
      <section className="border-y border-slate-200/80 bg-white/70 backdrop-blur py-12">
        <Container>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Truck,
                title: "Giao hàng nhanh",
                desc: "Giao trong 24-48h nội thành",
              },
              {
                icon: ShieldCheck,
                title: "Bảo hành chính hãng",
                desc: "Lên đến 36 tháng",
              },
              {
                icon: RotateCcw,
                title: "Đổi trả dễ dàng",
                desc: "Trong vòng 15 ngày",
              },
              {
                icon: HeadphonesIcon,
                title: "Hỗ trợ 24/7",
                desc: "Trợ lý AI luôn sẵn sàng",
              },
            ].map((b) => (
              <div key={b.title} className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white to-violet-50 text-violet-600 shadow-md shadow-violet-100/50">
                  <b.icon size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900">
                    {b.title}
                  </p>
                  <p className="text-xs text-slate-500">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Newsletter */}
      <section className="py-14">
        <Container>
          <div className="mx-auto max-w-xl rounded-2xl border border-violet-200/50 bg-white p-8 text-center shadow-lg shadow-violet-100/30 sm:p-12 gradient-border">
            <h2 className="text-xl font-bold text-ink-900 sm:text-2xl">
              Nhận ưu đãi công nghệ mới nhất
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Đăng ký để nhận gợi ý AI và ưu đãi độc quyền từ NEURALSTORE.
            </p>
            <form
              onSubmit={handleSubscribe}
              className="mt-6 flex flex-col gap-2 sm:flex-row"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn"
                aria-label="Email"
                className="h-11 w-full flex-1 rounded-md border border-slate-300 px-4 text-sm outline-none focus:border-violet-500 focus:shadow-glow-violet"
              />
              <Button type="submit" icon={<Send size={16} />}>
                Đăng ký
              </Button>
            </form>
          </div>
        </Container>
      </section>
    </div>
  );
}
