import { Link } from "react-router-dom";
import Container from "../../components/ui/Container";
export default function ForgotPasswordPage() {
  return (
    <Container className="flex justify-center py-16">
      <div className="max-w-sm rounded border bg-white p-6">
        <h1 className="text-2xl font-bold">Quên mật khẩu</h1>
        <p className="mt-4 text-sm text-slate-600">
          Khôi phục mật khẩu qua email chưa được kích hoạt. Vui lòng liên hệ
          quản trị viên để được hỗ trợ.
        </p>
        <Link className="mt-5 block text-violet-600" to="/login">
          Quay lại đăng nhập
        </Link>
      </div>
    </Container>
  );
}
