import api from '../api';

export interface Subscription {
  id: string;
  userId: string;
  tariffType: 'STANDARD' | 'COMFORT' | 'PREMIUM';
  startedAt: string;
  expiresAt: string;
  autoRenew: boolean;
  specializationCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TariffInfo {
  name: string;
  price: number;
  responsePrice: number;
  orderTakenPrice: number;
  description: string;
  duration?: number;
  specializationCount: number;
  features: string[];
}

export interface Tariff {
  tariffType: string;
  isActive: boolean;
  expiresAt: string | null;
  specializationCount: number;
}

export interface CanRespondResult {
  canRespond: boolean;
  reason?: string;
  costPerResponse?: number;
}

/**
 * Получить мою подписку
 */
export async function getMySubscription(): Promise<Subscription | null> {
  const { data } = await api.get('/subscriptions/my');
  return data.subscription;
}

/**
 * Получить текущий тариф
 */
export async function getCurrentTariff(): Promise<Tariff> {
  const { data } = await api.get('/subscriptions/tariff');
  return data.tariff;
}

/**
 * Получить информацию о всех тарифах
 */
export async function getTariffInfo(): Promise<Record<string, TariffInfo>> {
  const { data } = await api.get('/subscriptions/tariffs');
  return data.tariffs;
}

/**
 * Сменить тариф
 */
export async function changeTariff(tariffType: 'STANDARD' | 'COMFORT'): Promise<Subscription> {
  const { data } = await api.post('/subscriptions/change-tariff', { tariffType });
  return data.subscription;
}

/**
 * Проверить возможность отклика на заказ
 */
export async function canRespondToOrder(): Promise<CanRespondResult> {
  const { data } = await api.get('/subscriptions/can-respond');
  return data;
}

