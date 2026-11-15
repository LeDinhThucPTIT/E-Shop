import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Container from '../../components/ui/Container';
import Button from '../../components/ui/Button';
import { paymentApi, type PaymentResult } from '../../services/paymentApi';
import { errorMessage } from '../../services/axiosClient';

export default function PaymentResultPage() {
  const [params] = useSearchParams();
  const reference = params.get('orderId') || '';
  const [result, setResult] = useState<PaymentResult>();
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let checks = 0;
    const load = async () => {
      try {
        if (!reference) throw new Error('Thiếu mã giao dịch MoMo');
        const data = await paymentApi.result(reference);
        if (!active) return;
        setResult(data); setError('');
        if (data.paymentStatus === 'pending' && data.orderStatus !== 'cancelled' && !data.needsReview && ++checks < 15)
          timer = setTimeout(load, 4000);
      } catch (err) { if (active) setError(errorMessage(err)); }
    };
    void load();
    return () => { active = false; clearTimeout(timer); };
  }, [reference, refresh]);
  const title = result?.needsReview ? 'Giao dịch cần được đối soát' : result?.paymentStatus === 'paid' ? 'Thanh toán thành công' : result?.orderStatus === 'cancelled' ? 'Đơn hàng đã hủy' : result?.paymentStatus === 'failed' ? 'Thanh toán chưa thành công' : 'Đang xác nhận thanh toán';
  return <Container className="py-16"><div className="mx-auto max-w-xl rounded-xl border bg-white p-8 text-center">
    <h1 className="text-2xl font-bold">{error ? 'Chưa thể tải kết quả' : title}</h1>
    <p className="my-5 text-slate-600" role="status">{error || (result?.needsReview ? 'Vui lòng liên hệ cửa hàng để kiểm tra giao dịch. Không thanh toán thêm.' : result?.paymentStatus === 'paid' ? 'Hệ thống đã xác nhận nhận tiền từ MoMo.' : 'Kết quả được xác nhận từ máy chủ. Bạn có thể kiểm tra lại hoặc mở đơn hàng để tiếp tục.')}</p>
    {result && <p className="mb-5">Mã đơn: {result.orderCode}</p>}
    <div className="flex flex-wrap justify-center gap-4">
      <Button variant="outline" onClick={() => setRefresh(v => v + 1)}>Kiểm tra lại</Button>
      <Link className="self-center text-accent-600 underline" to={result ? `/orders/${encodeURIComponent(result.orderCode)}` : '/orders'}>Xem đơn hàng</Link>
    </div>
  </div></Container>;
}
