import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

export interface Crumb {
  label: string;
  to?: string;
}

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
      <Link to="/" className="flex items-center hover:text-accent-600" aria-label="Trang chủ">
        <Home size={13} />
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight size={12} className="text-slate-300" />
          {item.to ? (
            <Link to={item.to} className="hover:text-accent-600">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-ink-900">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
