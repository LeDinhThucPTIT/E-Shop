import client from './axiosClient';
export interface PaymentResult {
  orderCode: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: string;
  expiresAt?: string;
  needsReview: boolean;
}
export const paymentApi = {
  create: async (orderId: string): Promise<{ paymentUrl: string; expiresAt: string }> =>
    (await client.post('/payments/momo/create', { orderId }, { timeout: 40000 })).data.data,
  result: async (reference: string): Promise<PaymentResult> =>
    (await client.get(`/payments/momo/result/${encodeURIComponent(reference)}`)).data.data,
};
