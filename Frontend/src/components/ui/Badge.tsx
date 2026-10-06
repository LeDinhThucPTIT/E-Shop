import type { ReactNode } from "react";

type Variant = "default" | "accent" | "success" | "warning" | "error" | "info" | "outline" | "gradient-accent" | "gradient-error" | "gradient-success";

const variantClasses: Record<Variant, string> = {
  default: "bg-slate-100 text-slate-700",
  accent: "bg-accent-50 text-accent-600",
  success: "bg-success-50 text-success-600",
  warning: "bg-warning-50 text-warning-600",
  error: "bg-error-50 text-error-600",
  info: "bg-info-50 text-info-600",
  outline: "border border-slate-300 text-slate-600 bg-white",
  "gradient-accent": "bg-gradient-to-r from-accent-500 to-violet-500 text-white",
  "gradient-error": "bg-gradient-to-r from-rose-500 to-error-500 text-white",
  "gradient-success": "bg-gradient-to-r from-emerald-400 to-cyan-500 text-white",
};

export default function Badge({
  children,
  variant = "default",
  className = "",
}: {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-xs px-2 py-0.5 text-xs font-semibold ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
