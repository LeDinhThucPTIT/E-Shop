import { Link } from "react-router-dom";
import { CompassIcon } from "lucide-react";
import Container from "../../components/ui/Container";
import Button from "../../components/ui/Button";

export default function NotFoundPage() {
  return (
    <Container className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-300">
        <CompassIcon size={36} />
      </div>
      <h1 className="mt-6 text-6xl font-extrabold text-ink-900">404</h1>
      <h2 className="mt-2 text-xl font-semibold text-ink-900">Không tìm thấy trang</h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        Trang bạn đang tìm không tồn tại hoặc đã được di chuyển. Hãy quay lại trang mua sắm.
      </p>
      <Link to="/">
        <Button size="lg" className="mt-8">
          Về trang mua sắm
        </Button>
      </Link>
    </Container>
  );
}
