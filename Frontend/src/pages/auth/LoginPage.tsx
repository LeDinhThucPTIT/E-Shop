import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Sparkles } from "lucide-react";
import Container from "../../components/ui/Container";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useAuthStore } from "../../stores/useAuthStore";
import { useUIStore } from "../../stores/useUIStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { showToast } = useUIStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password || password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.ok) {
      setError(res.message || "Đăng nhập thất bại.");
      return;
    }
    showToast("Đăng nhập thành công!", "success");
    navigate("/profile");
  };

  return (
    <Container className="flex justify-center py-16 bg-mesh min-h-[80vh]">
      <div className="w-full max-w-sm rounded-2xl border border-white/60 bg-white/90 p-8 shadow-lg shadow-violet-100/30 backdrop-blur-xl">
        <div className="mb-8 text-center">
          <span className="text-xl font-extrabold text-ink-900">
            NEURAL<span className="gradient-text">STORE</span>
          </span>
          <h1 className="mt-4 text-2xl font-bold text-ink-900">Đăng nhập</h1>
          <p className="mt-1 text-sm text-slate-500">Chào mừng bạn quay trở lại</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            icon={<Mail size={16} />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Mật khẩu"
            type="password"
            icon={<Lock size={16} />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error}
            required
          />
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs font-medium text-accent-600 hover:underline">
              Quên mật khẩu?
            </Link>
          </div>
          <Button type="submit" fullWidth size="lg" loading={loading}>
            Đăng nhập
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-400">hoặc</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => showToast("Đăng nhập xã hội chỉ mang tính minh họa", "info")}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-300 text-sm font-medium text-ink-900 hover:bg-violet-50 hover:border-violet-300 transition-all duration-200"
          >
            Tiếp tục với Google
          </button>
          <button
            type="button"
            onClick={() => showToast("Đăng nhập xã hội chỉ mang tính minh họa", "info")}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-300 text-sm font-medium text-ink-900 hover:bg-violet-50 hover:border-violet-300 transition-all duration-200"
          >
            Tiếp tục với Facebook
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="font-semibold text-accent-600 hover:underline">
            Đăng ký ngay
          </Link>
        </p>
        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-violet-400">
          <Sparkles size={12} /> Xác thực mô phỏng — không kết nối máy chủ thật
        </div>
      </div>
    </Container>
  );
}
