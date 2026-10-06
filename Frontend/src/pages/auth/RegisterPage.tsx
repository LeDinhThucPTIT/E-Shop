import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User } from "lucide-react";
import Container from "../../components/ui/Container";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useAuthStore } from "../../stores/useAuthStore";
import { useUIStore } from "../../stores/useUIStore";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const { showToast } = useUIStore();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = "Vui lòng nhập họ tên";
    if (!form.email.includes("@")) errs.email = "Email không hợp lệ";
    if (form.password.length < 6) errs.password = "Mật khẩu phải có ít nhất 6 ký tự";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Mật khẩu xác nhận không khớp";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    const res = await register(form.fullName, form.email, form.password);
    setLoading(false);
    if (!res.ok) {
      setErrors({ email: res.message || "Đăng ký thất bại." });
      return;
    }
    showToast("Đăng ký thành công! Chào mừng bạn đến với NEURALSTORE.", "success");
    navigate("/profile");
  };

  return (
    <Container className="flex justify-center py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-xl font-extrabold text-ink-900">
            NEURAL<span className="text-accent-500">STORE</span>
          </span>
          <h1 className="mt-4 text-2xl font-bold text-ink-900">Tạo tài khoản</h1>
          <p className="mt-1 text-sm text-slate-500">Bắt đầu mua sắm thông minh với AI</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Họ và tên"
            icon={<User size={16} />}
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            error={errors.fullName}
          />
          <Input
            label="Email"
            type="email"
            icon={<Mail size={16} />}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors.email}
          />
          <Input
            label="Mật khẩu"
            type="password"
            icon={<Lock size={16} />}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password}
          />
          <Input
            label="Xác nhận mật khẩu"
            type="password"
            icon={<Lock size={16} />}
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            error={errors.confirmPassword}
          />
          <Button type="submit" fullWidth size="lg" loading={loading}>
            Đăng ký
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Đã có tài khoản?{" "}
          <Link to="/login" className="font-semibold text-accent-600 hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </Container>
  );
}
