import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";
export default function RequireAuth({ admin = false }: { admin?: boolean }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();
  if (isLoading)
    return <p className="p-8 text-center">Đang kiểm tra phiên đăng nhập...</p>;
  if (!isAuthenticated)
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  if (admin && user?.role !== "admin") return <Navigate to="/" replace />;
  return <Outlet />;
}
