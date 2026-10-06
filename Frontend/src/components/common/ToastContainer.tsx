import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { useUIStore } from "../../stores/useUIStore";

const iconMap = {
  success: <CheckCircle2 size={18} className="text-success-500" />,
  error: <XCircle size={18} className="text-error-500" />,
  info: <Info size={18} className="text-info-500" />,
  warning: <AlertTriangle size={18} className="text-warning-500" />,
};

export default function ToastContainer() {
  const { toasts, dismissToast } = useUIStore();

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[200] flex w-[calc(100%-2.5rem)] max-w-sm flex-col gap-2.5">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 shadow-lg animate-slideInRight"
        >
          {iconMap[toast.type]}
          <p className="flex-1 text-sm font-medium text-ink-900">{toast.message}</p>
          <button
            onClick={() => dismissToast(toast.id)}
            className="text-slate-400 hover:text-ink-900"
            aria-label="Đóng thông báo"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
