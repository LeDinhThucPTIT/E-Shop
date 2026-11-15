import { Link } from 'react-router-dom';
import { Code2 } from 'lucide-react';
import Container from '../ui/Container';

const columns = [
  {
    title: 'Khám phá',
    links: [
      { label: 'Sản phẩm', to: '/products' },
      { label: 'Danh mục', to: '/categories' },
      { label: 'So sánh sản phẩm', to: '/compare' },
      { label: 'Trợ lý mua sắm', to: '/ai-assistant' },
    ],
  },
  {
    title: 'Tài khoản',
    links: [
      { label: 'Hồ sơ', to: '/profile' },
      { label: 'Đơn hàng của tôi', to: '/orders' },
      { label: 'Sản phẩm yêu thích', to: '/wishlist' },
      { label: 'Giỏ hàng', to: '/cart' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-[#0A0E17] text-slate-300">
      <Container className="py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Link to="/" className="text-lg font-extrabold text-white" aria-label="NEURALSTORE — Trang chủ">
              NEURAL<span className="text-accent-500">STORE</span>
            </Link>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
              Khám phá thiết bị công nghệ, so sánh sản phẩm và tìm lựa chọn phù hợp với nhu cầu, ngân sách của bạn.
            </p>
            <a href="https://github.com/LeDinhThucPTIT/digital-store-mern" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
              <Code2 size={18} /> Mã nguồn trên GitHub
            </a>
          </div>
          {columns.map(column => (
            <div key={column.title}>
              <h2 className="text-sm font-semibold text-white">{column.title}</h2>
              <ul className="mt-3 space-y-2.5">
                {column.links.map(link => <li key={link.to}><Link to={link.to} className="text-sm text-slate-400 hover:text-white">{link.label}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col justify-between gap-3 border-t border-slate-800 pt-6 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} NEURALSTORE.</p>
          <p>Thanh toán khi nhận hàng · MoMo sandbox</p>
        </div>
      </Container>
    </footer>
  );
}
