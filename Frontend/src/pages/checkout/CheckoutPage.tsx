import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  Truck,
  Zap,
  Wallet,
  Landmark,
  QrCode,
  Loader2,
  CheckCircle2,
  XCircle,
  ShoppingBag,
} from "lucide-react";
import Container from "../../components/ui/Container";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import EmptyState from "../../components/ui/EmptyState";
import { itemPrice, useCartStore } from "../../stores/useCartStore";
import { useOrdersStore } from "../../stores/useOrdersStore";
import { errorMessage } from "../../services/axiosClient";
import { paymentApi } from '../../services/paymentApi';
import { formatVND } from "../../utils/format";
import type { PaymentMethod } from "../../types";
import { useUIStore } from "../../stores/useUIStore";

const STEPS = ["Thông tin", "Vận chuyển", "Thanh toán", "Xác nhận"];

const paymentOptions: {
  value: PaymentMethod;
  label: string;
  desc: string;
  icon: React.ElementType;
}[] = [
  {
    value: "cod",
    label: "Thanh toán khi nhận hàng",
    desc: "Tiền mặt (COD)",
    icon: Wallet,
  },
  {
    value: "momo",
    label: "MoMo",
    desc: "Thanh toán qua ví MoMo",
    icon: QrCode,
  },
  {
    value: "bank-transfer",
    label: "Chuyển khoản ngân hàng",
    desc: "Chuyển khoản trực tiếp",
    icon: Landmark,
  },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, fetchCart, isLoading } = useCartStore();
  const { createOrder } = useOrdersStore();
  const { showToast } = useUIStore();

  const submitting = useRef(false);
  const [step, setStep] = useState(0);
  const [info, setInfo] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    district: "",
    ward: "",
  });
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">(
    "standard",
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [paymentState, setPaymentState] = useState<
    "idle" | "processing" | "success" | "failed"
  >("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (isLoading && !items.length)
    return <Container className="py-16">Đang tải giỏ hàng...</Container>;
  if (items.length === 0 && paymentState !== "success") {
    return (
      <Container className="py-16">
        <EmptyState
          icon={<ShoppingBag size={26} />}
          title="Giỏ hàng trống"
          description="Bạn cần có sản phẩm trong giỏ hàng để tiến hành thanh toán."
          actionLabel="Khám phá sản phẩm"
          onAction={() => navigate("/products")}
        />
      </Container>
    );
  }

  const sub = subtotal();
  const shippingFee =
    shippingMethod === "express" ? 80_000 : sub > 20_000_000 ? 0 : 50_000;
  const tax = Math.round(sub * 0.08);
  const total = sub + shippingFee + tax;

  const validateInfo = () => {
    const errs: Record<string, string> = {};
    if (!info.fullName.trim()) errs.fullName = "Vui lòng nhập họ tên";
    if (!/^\d{9,11}$/.test(info.phone.replace(/\s/g, "")))
      errs.phone = "Số điện thoại không hợp lệ";
    if (!info.email.includes("@")) errs.email = "Email không hợp lệ";
    if (!info.address.trim()) errs.address = "Vui lòng nhập địa chỉ";
    if (!info.city.trim()) errs.city = "Vui lòng nhập tỉnh/thành phố";
    if (!info.district.trim()) errs.district = "Vui lòng nhập quận/huyện";
    if (!info.ward.trim()) errs.ward = "Vui lòng nhập phường/xã";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 0 && !validateInfo()) return;
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const processPayment = async () => {
    if (submitting.current || !validateInfo()) return;
    if (items.some((i) => !i.product)) {
      showToast(
        "Có sản phẩm không còn tồn tại. Vui lòng kiểm tra giỏ hàng.",
        "error",
      );
      return;
    }
    submitting.current = true;
    setPaymentState("processing");
    try {
      const input = {
        items: items.map((i) => ({
          product: i.product!._id,
          sku: i.sku,
          quantity: i.quantity,
        })),
        shippingAddress: {
          name: info.fullName,
          phone: info.phone.replace(/\s/g, ""),
          email: info.email,
          street: info.address,
          province: info.city,
          district: info.district,
          ward: info.ward,
        },
        shippingMethod,
        paymentMethod,
      };
      const fingerprint = JSON.stringify(input);
      let intent: { fingerprint: string; key: string } | null = null;
      try {
        intent = JSON.parse(
          sessionStorage.getItem("checkout-intent") || "null",
        );
      } catch {
        /* Start a fresh checkout intent. */
      }
      if (intent?.fingerprint !== fingerprint)
        intent = { fingerprint, key: crypto.randomUUID() };
      sessionStorage.setItem("checkout-intent", JSON.stringify(intent));
      const order = await createOrder(input, intent!.key);
      setPaymentState("success");
      sessionStorage.removeItem("checkout-intent");
      await fetchCart();
      if (paymentMethod === 'momo') {
        try {
          const payment = await paymentApi.create(order._id);
          window.location.assign(payment.paymentUrl);
        } catch (error) {
          showToast(errorMessage(error), 'error');
          navigate(`/orders/${encodeURIComponent(order.id)}`);
        }
        return;
      }
      showToast("Đặt hàng thành công!", "success");
      navigate("/checkout/success", { state: { orderId: order.id } });
    } catch (error) {
      setPaymentState("failed");
      showToast(errorMessage(error), "error");
    } finally {
      submitting.current = false;
    }
  };

  return (
    <Container className="py-8">
      <h1 className="mb-8 text-2xl font-bold text-ink-900">Thanh toán</h1>

      <div className="mb-10 flex items-center">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                  i < step
                    ? "bg-accent-500 text-white"
                    : i === step
                      ? "border-2 border-accent-500 text-accent-600"
                      : "border border-slate-200 text-slate-400"
                }`}
              >
                {i < step ? <Check size={16} /> : i + 1}
              </div>
              <span
                className={`hidden text-xs font-medium sm:block ${i <= step ? "text-ink-900" : "text-slate-400"}`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-2 h-0.5 flex-1 ${i < step ? "bg-accent-500" : "bg-slate-200"}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-ink-900">
                Thông tin giao hàng
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Họ và tên"
                  value={info.fullName}
                  onChange={(e) =>
                    setInfo({ ...info, fullName: e.target.value })
                  }
                  error={errors.fullName}
                />
                <Input
                  label="Số điện thoại"
                  value={info.phone}
                  onChange={(e) => setInfo({ ...info, phone: e.target.value })}
                  error={errors.phone}
                />
              </div>
              <Input
                label="Email"
                type="email"
                value={info.email}
                onChange={(e) => setInfo({ ...info, email: e.target.value })}
                error={errors.email}
              />
              <Input
                label="Địa chỉ"
                value={info.address}
                onChange={(e) => setInfo({ ...info, address: e.target.value })}
                error={errors.address}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Input
                  label="Tỉnh/Thành phố"
                  value={info.city}
                  onChange={(e) => setInfo({ ...info, city: e.target.value })}
                  error={errors.city}
                />
                <Input
                  label="Quận/Huyện"
                  value={info.district}
                  onChange={(e) =>
                    setInfo({ ...info, district: e.target.value })
                  }
                  error={errors.district}
                />
                <Input
                  label="Phường/Xã"
                  value={info.ward}
                  onChange={(e) => setInfo({ ...info, ward: e.target.value })}
                  error={errors.ward}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-ink-900">
                Phương thức vận chuyển
              </h2>
              <div className="space-y-3">
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-md border p-4 ${
                    shippingMethod === "standard"
                      ? "border-accent-500 bg-accent-50/50"
                      : "border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    checked={shippingMethod === "standard"}
                    onChange={() => setShippingMethod("standard")}
                    className="h-4 w-4 text-accent-500"
                  />
                  <Truck size={20} className="text-slate-500" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink-900">
                      Giao hàng tiêu chuẩn
                    </p>
                    <p className="text-xs text-slate-500">
                      Nhận hàng trong 3-5 ngày
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-ink-900">
                    {sub > 20_000_000 ? "Miễn phí" : formatVND(50_000)}
                  </span>
                </label>
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-md border p-4 ${
                    shippingMethod === "express"
                      ? "border-accent-500 bg-accent-50/50"
                      : "border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    checked={shippingMethod === "express"}
                    onChange={() => setShippingMethod("express")}
                    className="h-4 w-4 text-accent-500"
                  />
                  <Zap size={20} className="text-slate-500" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink-900">
                      Giao hàng nhanh
                    </p>
                    <p className="text-xs text-slate-500">
                      Nhận hàng trong 1-2 ngày
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-ink-900">
                    {formatVND(80_000)}
                  </span>
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-ink-900">
                Phương thức thanh toán
              </h2>
              <div className="space-y-3">
                {paymentOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-md border p-4 ${
                      paymentMethod === opt.value
                        ? "border-accent-500 bg-accent-50/50"
                        : "border-slate-200"
                    }`}
                  >
                    <input
                      type="radio"
                      disabled={!['cod', 'momo'].includes(opt.value)}
                      checked={paymentMethod === opt.value}
                      onChange={() => setPaymentMethod(opt.value)}
                      className="h-4 w-4 text-accent-500"
                    />
                    {opt.value === 'momo' ? (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-600 text-xs font-bold leading-tight text-white" aria-hidden="true">MoMo</span>
                    ) : <opt.icon size={20} className="text-slate-500" />}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-ink-900">
                        {opt.label}
                        {!['cod', 'momo'].includes(opt.value) ? " (chưa hỗ trợ)" : ""}
                      </p>
                      <p className="text-xs text-slate-500">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              {paymentMethod === 'momo' && (
                <div className="mt-5 rounded-xl border border-pink-200 bg-pink-50 p-5">
                  <div className="flex items-center gap-2 font-semibold text-pink-800">
                    <QrCode size={20} /> Thanh toán an toàn qua MoMo
                  </div>
                  <p className="mt-2 text-sm leading-6 text-pink-900">
                    Sau khi xác nhận đơn hàng, bạn sẽ được chuyển đến trang MoMo để quét mã QR hoặc mở ứng dụng và xác nhận thanh toán.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-pink-200 pt-4">
                    <span className="text-sm text-pink-800">Tổng thanh toán dự kiến</span>
                    <span className="text-xl font-bold text-pink-700">{formatVND(total)}</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-pink-800">Kết quả thanh toán sẽ được cập nhật trong đơn hàng sau khi MoMo xác nhận.</p>
                </div>
              )}
              <p className="mt-4 text-xs text-slate-400">
                Đơn hàng được lưu trên hệ thống. Hiện hỗ trợ thanh toán khi nhận
                hàng (COD) và MoMo.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center py-6 text-center">
              {paymentState === "idle" && (
                <>
                  <h2 className="text-lg font-semibold text-ink-900">
                    Xác nhận đơn hàng
                  </h2>
                  <p className="mt-2 max-w-sm text-sm text-slate-500">
                    Vui lòng kiểm tra lại thông tin đơn hàng trước khi xác nhận
                    thanh toán.
                  </p>
                  <div className="mt-5 w-full max-w-md rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-sm">
                    <p className="font-medium text-ink-900">{info.fullName} · {info.phone}</p>
                    <p className="mt-1 text-slate-600">{[info.address, info.ward, info.district, info.city].filter(Boolean).join(', ')}</p>
                    <p className="mt-3 text-slate-600">Phương thức: <span className="font-semibold text-ink-900">{paymentMethod === 'momo' ? 'Ví MoMo' : 'Thanh toán khi nhận hàng (COD)'}</span></p>
                    <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 font-semibold text-ink-900"><span>Tổng dự kiến</span><span>{formatVND(total)}</span></div>
                  </div>
                  {paymentMethod === 'momo' && <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">Bấm nút bên dưới để tạo đơn và mở trang thanh toán MoMo. Bạn xác nhận trả tiền trên MoMo ở bước tiếp theo.</p>}
                  <Button size="lg" className={`mt-6 ${paymentMethod === 'momo' ? 'bg-pink-600 from-pink-600 to-pink-600 hover:from-pink-700 hover:to-pink-700' : ''}`} onClick={processPayment}>
                    {paymentMethod === 'momo' ? <><QrCode size={20} /> Đặt hàng và thanh toán MoMo</> : 'Xác nhận đặt hàng COD'}
                  </Button>
                  <button className="mt-4 text-sm text-slate-500 underline hover:text-ink-900" onClick={() => setStep(2)}>Đổi phương thức thanh toán</button>
                </>
              )}
              {paymentState === "processing" && (
                <>
                  <Loader2 size={40} className="animate-spin text-accent-500" />
                  <p className="mt-4 text-sm font-medium text-slate-600">
                    Đang tạo đơn hàng...
                  </p>
                </>
              )}
              {paymentState === "failed" && (
                <>
                  <XCircle size={40} className="text-error-500" />
                  <p className="mt-4 text-sm font-medium text-ink-900">
                    Đặt hàng thất bại
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Đã có lỗi xảy ra, vui lòng thử lại.
                  </p>
                  <Button className="mt-6" onClick={processPayment}>
                    Thử lại
                  </Button>
                </>
              )}
              {paymentState === "success" && (
                <>
                  <CheckCircle2 size={40} className="text-success-500" />
                  <p className="mt-4 text-sm font-medium text-ink-900">
                    Đang chuyển hướng...
                  </p>
                </>
              )}
            </div>
          )}

          {step < 3 && (
            <div className="mt-8 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
              >
                Quay lại
              </Button>
              <Button onClick={handleNext}>Tiếp tục</Button>
            </div>
          )}
        </div>

        <div className="h-fit rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-ink-900">
            Đơn hàng của bạn
          </h2>
          <div className="mt-4 max-h-64 space-y-3 overflow-y-auto">
            {items.map((item) => {
              const p = item.product;
              if (!p) return null;
              return (
                <div
                  key={`${p._id}:${item.sku}`}
                  className="flex items-center gap-3"
                >
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    className="h-12 w-12 rounded-sm object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-xs font-medium text-ink-900">
                      {p.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      SL: {item.quantity}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-ink-900">
                    {formatVND(itemPrice(item) * item.quantity)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Tạm tính</span>
              <span>{formatVND(sub)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Vận chuyển</span>
              <span>
                {shippingFee === 0 ? "Miễn phí" : formatVND(shippingFee)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Thuế</span>
              <span>{formatVND(tax)}</span>
            </div>
          </div>
          <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-base font-bold text-ink-900">
            <span>Tổng cộng</span>
            <span>{formatVND(total)}</span>
          </div>
        </div>
      </div>
    </Container>
  );
}
