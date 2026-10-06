import { Star } from "lucide-react";

export default function Rating({
  value,
  count,
  size = 14,
  showValue = true,
}: {
  value: number;
  count?: number;
  size?: number;
  showValue?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: 5 }, (_, i) => {
          const filled = i < Math.round(value);
          return (
            <Star
              key={i}
              size={size}
              className={filled ? "fill-warning-500 text-warning-500" : "fill-slate-200 text-slate-200"}
            />
          );
        })}
      </div>
      {showValue && <span className="text-xs font-medium text-slate-600">{value.toFixed(1)}</span>}
      {count !== undefined && <span className="text-xs text-slate-400">({count})</span>}
    </div>
  );
}
