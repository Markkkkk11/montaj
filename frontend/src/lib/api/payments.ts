import api from '../api';

export interface Payment {
  id: string;
  userId: string;
  yookassaPaymentId?: string;
  amount: string;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'CANCELLED' | 'FAILED';
  purpose: string;
  description: string;
  confirmationUrl?: string;
  paid: boolean;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentHistory {
  payments: Payment[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Создать платёж для пополнения баланса
 */
export async function createTopUpPayment(amount: number): Promise<{
  payment: Payment;
  confirmationUrl: string;
}> {
  const { data } = await api.post('/payments/top-up', { amount });
  return data;
}

/**
 * Создать платёж для подписки Premium
 */
export async function createPremiumSubscriptionPayment(): Promise<{
  payment: Payment;
  confirmationUrl: string;
}> {
  const { data } = await api.post('/payments/subscription/premium');
  return data;
}

/**
 * Получить информацию о платеже
 */
export async function getPayment(paymentId: string): Promise<Payment> {
  const { data } = await api.get(`/payments/${paymentId}`);
  return data.payment;
}

/**
 * Получить историю платежей
 */
export async function getPaymentHistory(
  page: number = 1,
  limit: number = 20
): Promise<PaymentHistory> {
  const { data } = await api.get('/payments', {
    params: { page, limit },
  });
  return data;
}

/**
 * Обработать успешный платёж
 */
export async function processPaymentSuccess(paymentId: string): Promise<Payment> {
  const { data } = await api.get('/payments/success/callback', {
    params: { payment_id: paymentId },
  });
  return data.payment;
}

