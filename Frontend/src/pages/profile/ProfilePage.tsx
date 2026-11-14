import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Package,
  Heart,
  MapPin,
  CreditCard,
  Clock,
  Settings,
  LogOut,
  Mail,
  Phone,
} from "lucide-react";
import Container from "../../components/ui/Container";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import { useAuthStore } from "../../stores/useAuthStore";
import { useOrdersStore, STATUS_LABELS } from "../../stores/useOrdersStore";
import { useWishlistStore } from "../../stores/useWishlistStore";
import { getProductById, useCatalogStore } from "../../stores/useCatalogStore";
import { formatVND, formatDate } from "../../utils/format";
import { useUIStore } from "../../stores/useUIStore";
import { Link } from "react-router-dom";

const TABS = [
  { key: "info", label: "Thông tin cá nhân", icon: User },
  { key: "orders", label: "Đơn hàng", icon: Package },
  { key: "wishlist", label: "Yêu thích", icon: Heart },
  { key: "addresses", label: "Địa chỉ", icon: MapPin },
  { key: "payment", label: "Phương thức thanh toán", icon: CreditCard },
  { key: "recent", label: "Đã xem gần đây", icon: Clock },
  { key: "settings", label: "Cài đặt", icon: Settings },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, updateProfile } = useAuthStore();
  const { orders, fetchOrders } = useOrdersStore();
  useEffect(() => {
    if (isAuthenticated) void fetchOrders();
  }, [isAuthenticated, fetchOrders]);
  const { productIds } = useWishlistStore();
  const { showToast } = useUIStore();
  useCatalogStore((s) => s.products);
  const [tab, setTab] = useState("info");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || "");

  if (!isAuthenticated || !user) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={<User size={26} />}
          title="Bạn chưa đăng nhập"
          description="Đăng nhập để quản lý đơn hàng, danh sách yêu thích và thông tin cá nhân."
          actionLabel="Đăng nhập"
          onAction={() => navigate("/login")}
        />
      </Container>
    );
  }

  const recentIds: string[] = (() => {
    try {
      return JSON.parse(
        localStorage.getItem("neuralstore-recently-viewed") || "[]",
      );
    } catch {
      return [];
    }
  })();

  return (
    <Container className="py-8">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink-900 text-xl font-bold text-white">
          {user.fullName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink-900">{user.fullName}</h1>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="flex h-fit gap-1 overflow-x-auto rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm lg:flex-col lg:overflow-visible">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-accent-50 text-accent-600"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
          <button
            onClick={() => {
              logout();
              showToast("Đã đăng xuất", "info");
              navigate("/");
            }}
            className="flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-error-500 hover:bg-error-50"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </aside>

        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
          {tab === "info" && (
            <div className="max-w-md space-y-4">
              <h2 className="text-lg font-semibold text-ink-900">
                Thông tin cá nhân
              </h2>
              <Input
                label="Họ và tên"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <Input
                label="Email"
                icon={<Mail size={15} />}
                value={user.email}
                disabled
              />
              <Input
                label="Số điện thoại"
                icon={<Phone size={15} />}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Button
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  const ok = await updateProfile({ fullName, phone });
                  setSaving(false);
                  showToast(
                    ok ? "Đã lưu thông tin cá nhân" : "Không thể lưu thông tin",
                    ok ? "success" : "error",
                  );
                }}
              >
                Lưu thay đổi
              </Button>
            </div>
          )}

          {tab === "orders" && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-ink-900">
                Đơn hàng gần đây
              </h2>
              {orders.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Bạn chưa có đơn hàng nào.
                </p>
              ) : (
                <div className="flex flex-col divide-y divide-slate-100">
                  {orders.map((o) => (
                    <Link
                      key={o.id}
                      to={`/orders/${o.id}`}
                      className="flex items-center justify-between py-3 hover:text-accent-600"
                    >
                      <div>
                        <p className="text-sm font-medium">#{o.id}</p>
                        <p className="text-xs text-slate-400">
                          {formatDate(o.createdAt)}
                        </p>
                      </div>
                      <Badge variant="accent">{STATUS_LABELS[o.status]}</Badge>
                      <span className="text-sm font-semibold">
                        {formatVND(o.total)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "wishlist" && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-ink-900">
                Sản phẩm yêu thích
              </h2>
              {productIds.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Danh sách yêu thích trống.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {productIds.map((id) => {
                    const p = getProductById(id);
                    if (!p) return null;
                    return (
                      <Link
                        key={id}
                        to={`/products/${p.slug}`}
                        className="flex items-center gap-3 rounded-sm border border-slate-100 p-2 hover:border-accent-200"
                      >
                        <img
                          src={p.images[0]}
                          alt=""
                          className="h-12 w-12 rounded-sm object-cover"
                        />
                        <div>
                          <p className="line-clamp-1 text-sm font-medium">
                            {p.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatVND(p.price)}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === "addresses" && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-ink-900">
                Địa chỉ đã lưu
              </h2>
              {orders.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Chưa có địa chỉ nào được lưu.
                </p>
              ) : (
                <div className="rounded-md border border-slate-100 p-4 text-sm text-slate-600">
                  <p className="font-medium text-ink-900">
                    {orders[0].address.fullName}
                  </p>
                  <p>{orders[0].address.phone}</p>
                  <p>
                    {orders[0].address.address}, {orders[0].address.ward},{" "}
                    {orders[0].address.district}, {orders[0].address.city}
                  </p>
                </div>
              )}
            </div>
          )}

          {tab === "payment" && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-ink-900">
                Phương thức thanh toán
              </h2>
              <p className="text-sm text-slate-500">
                Chưa có phương thức thanh toán nào được lưu. Bạn có thể chọn
                phương thức thanh toán khi đặt hàng.
              </p>
            </div>
          )}

          {tab === "recent" && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-ink-900">
                Đã xem gần đây
              </h2>
              {recentIds.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Bạn chưa xem sản phẩm nào gần đây.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {recentIds.map((id) => {
                    const p = getProductById(id);
                    if (!p) return null;
                    return (
                      <Link
                        key={id}
                        to={`/products/${p.slug}`}
                        className="flex items-center gap-3 rounded-sm border border-slate-100 p-2 hover:border-accent-200"
                      >
                        <img
                          src={p.images[0]}
                          alt=""
                          className="h-12 w-12 rounded-sm object-cover"
                        />
                        <p className="line-clamp-1 text-sm font-medium">
                          {p.name}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === "settings" && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-ink-900">
                Cài đặt tài khoản
              </h2>
              <div className="space-y-3">
                <label className="flex items-center justify-between rounded-md border border-slate-100 p-3 text-sm">
                  Nhận thông báo khuyến mãi qua email
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 accent-accent-500"
                  />
                </label>
                <label className="flex items-center justify-between rounded-md border border-slate-100 p-3 text-sm">
                  Gợi ý sản phẩm dựa trên AI
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 accent-accent-500"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
