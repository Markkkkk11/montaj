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

export async function createTopUpPaymentWithReturnPath(
  amount: number,
  returnPath?: string
): Promise<{
  payment: Payment;
  confirmationUrl: string;
}> {
  const { data } = await api.post('/payments/top-up', { amount, returnPath });
  return data;
}

/**
 * Создать платёж для подписки (Comfort / Premium)
 */
export async function createSubscriptionPayment(tariffType: 'COMFORT' | 'PREMIUM'): Promise<{
  payment: Payment;
  confirmationUrl: string;
}> {
  const { data } = await api.post('/payments/subscription', { tariffType });
  return data;
}

export async function createSubscriptionPaymentWithReturnPath(
  tariffType: 'COMFORT' | 'PREMIUM',
  returnPath?: string
): Promise<{
  payment: Payment;
  confirmationUrl: string;
}> {
  const { data } = await api.post('/payments/subscription', { tariffType, returnPath });
  return data;
}

/**
 * Обратная совместимость
 */
export async function createPremiumSubscriptionPayment(): Promise<{
  payment: Payment;
  confirmationUrl: string;
}> {
  return createSubscriptionPaymentWithReturnPath('PREMIUM');
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
