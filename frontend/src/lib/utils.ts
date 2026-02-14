import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { User } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Форматирование номера телефона
export function formatPhone(phone: string): string {
  // Простое форматирование +7 (XXX) XXX-XX-XX
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('7')) {
    return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9)}`;
  }
  return phone;
}

// Проверка заполненности профиля исполнителя
export function isExecutorProfileComplete(user: User | null): boolean {
  if (!user || user.role !== 'EXECUTOR' || !user.executorProfile) {
    return false;
  }

  const profile = user.executorProfile;

  return (
    user.fullName.length > 0 &&
    user.city.length > 0 &&
    (profile.region?.length || 0) > 0 &&
    profile.specializations.length > 0 &&
    (profile.shortDescription?.length || 0) > 0
  );
}

// Маппинг специализаций на русский
export const SPECIALIZATION_LABELS: Record<string, string> = {
  WINDOWS: 'Окна',
  DOORS: 'Двери',
  CEILINGS: 'Потолки',
  CONDITIONERS: 'Кондиционеры',
  BLINDS: 'Жалюзи',
  FURNITURE: 'Мебель',
};

// Маппинг статусов
export const USER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'На модерации',
  ACTIVE: 'Активен',
  REJECTED: 'Отклонён',
  BLOCKED: 'Заблокирован',
};

// Маппинг тарифов
export const TARIFF_LABELS: Record<string, string> = {
  STANDARD: 'Стандарт',
  COMFORT: 'Комфорт',
  PREMIUM: 'Премиум',
};

