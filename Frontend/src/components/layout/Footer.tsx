import { Link } from "react-router-dom";
import { Code2, MessageCircle, Mail, Send } from "lucide-react";
import Container from "../ui/Container";
import { useUIStore } from "../../stores/useUIStore";
import { useState } from "react";

const columns = [
  {
    title: "Mua sắm",
    links: [
      { label: "Sản phẩm", to: "/products" },
      { label: "Danh mục", to: "/products" },
      { label: "Ưu đãi", to: "/products?sort=discount" },
    ],
  },
  {
    title: "Nền tảng AI",
    links: [
      { label: "Trợ lý AI", to: "/ai-assistant" },
      { label: "Gợi ý sản phẩm", to: "/ai-assistant" },
      { label: "So sánh", to: "/compare" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { label: "Liên hệ", to: "/profile" },
      { label: "Vận chuyển", to: "/orders" },
      { label: "Đổi trả", to: "/orders" },
      { label: "Câu hỏi thường gặp", to: "/" },
    ],
  },
];

export default function Footer() {
  const { showToast } = useUIStore();
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      showToast("Vui lòng nhập email hợp lệ", "error");
      return;
    }
    showToast("Đăng ký nhận bản tin thành công!", "success");
    setEmail("");
  };

  return (
    <footer className="border-t border-slate-800 bg-[#0A0E17] text-slate-300">
      <Container className="py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <span className="text-lg font-extrabold text-white">
              NEURAL<span className="text-accent-500">STORE</span>
            </span>
            <p className="mt-3 max-w-xs text-sm text-slate-400">
              Nền tảng thương mại điện tử ứng dụng AI, giúp bạn tìm đúng sản phẩm công nghệ
              phù hợp với nhu cầu, ngân sách và công việc.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/80 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
              >
                <Code2 size={16} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/80 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
              >
                <MessageCircle size={16} />
              </a>
              <a
                href="mailto:hello@neuralstore.vn"
                aria-label="Email"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/80 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
              >
                <Mail size={16} />
              </a>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white">{col.title}</h4>
              <ul className="mt-3 flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-slate-400 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="text-sm font-semibold text-white">Bản tin</h4>
            <p className="mt-3 text-sm text-slate-400">
              Nhận ưu đãi công nghệ mới nhất và gợi ý từ AI.
            </p>
            <form onSubmit={handleSubscribe} className="mt-3 flex items-center gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email của bạn"
                aria-label="Email đăng ký bản tin"
                className="h-10 w-full min-w-0 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-accent-500"
              />
              <button
                type="submit"
                aria-label="Đăng ký"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-500 text-white transition-colors hover:bg-accent-600"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-800/80 pt-6 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} NEURALSTORE. Tất cả các quyền được bảo lưu.</p>
          <p>Dự án demo frontend — không xử lý thanh toán thật.</p>
        </div>
      </Container>
    </footer>
  );
}
