import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "gradient";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-accent-500 to-violet-500 text-white hover:from-accent-600 hover:to-violet-600 active:from-accent-700 active:to-violet-700 shadow-sm hover:shadow-glow-violet disabled:bg-slate-300 disabled:from-slate-300 disabled:to-slate-300",
  secondary:
    "bg-ink-900 text-white hover:bg-ink-800 active:bg-ink-700 shadow-sm disabled:bg-slate-300",
  outline:
    "border border-slate-300 bg-white text-ink-900 hover:border-violet-400 hover:text-violet-600 disabled:text-slate-300",
  ghost: "text-ink-900 hover:bg-violet-50 disabled:text-slate-300",
  danger: "bg-gradient-to-r from-error-500 to-rose-500 text-white hover:from-error-600 hover:to-rose-600 disabled:bg-slate-300 disabled:from-slate-300 disabled:to-slate-300",
  gradient:
    "btn-gradient bg-gradient-to-r from-accent-500 via-violet-500 to-cyan-500 text-white shadow-md hover:shadow-glow-violet-lg disabled:bg-slate-300 disabled:from-slate-300 disabled:to-slate-300",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-sm",
  md: "h-10 px-4 text-sm gap-2 rounded-md",
  lg: "h-12 px-6 text-base gap-2 rounded-md",
  icon: "h-10 w-10 rounded-md justify-center",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      fullWidth,
      className = "",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center font-medium transition-all duration-150 disabled:cursor-not-allowed select-none whitespace-nowrap ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full justify-center" : ""} ${className}`}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
