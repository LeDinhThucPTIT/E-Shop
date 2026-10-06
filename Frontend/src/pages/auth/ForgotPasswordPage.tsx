import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, CheckCircle2 } from "lucide-react";
import Container from "../../components/ui/Container";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Email không hợp lệ");
      return;
    }
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setSent(true);
  };

  return (
    <Container className="flex justify-center py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-xl font-extrabold text-ink-900">
            NEURAL<span className="text-accent-500">STORE</span>
          </span>
          <h1 className="mt-4 text-2xl font-bold text-ink-900">Quên mật khẩu</h1>
          <p className="mt-1 text-sm text-slate-500">
            Nhập email của bạn, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
          </p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center rounded-md border border-slate-200 p-6 text-center">
            <CheckCircle2 size={32} className="text-success-500" />
            <p className="mt-3 text-sm text-slate-600">
              Nếu email <span className="font-semibold text-ink-900">{email}</span> tồn tại trong hệ thống,
              bạn sẽ nhận được liên kết đặt lại mật khẩu trong ít phút.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              icon={<Mail size={16} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
            />
            <Button type="submit" fullWidth size="lg" loading={loading}>
              Gửi hướng dẫn
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link to="/login" className="font-semibold text-accent-600 hover:underline">
            Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </Container>
  );
}
