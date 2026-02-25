import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { User } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Получить отображаемое имя пользователя из ФИО
export function getUserFirstName(fullName?: string): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return '';
  // Typical RU format: "Фамилия Имя Отчество"
  return parts.length > 1 ? parts[1] : parts[0];
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
  BLINDS: 'Рольставни',
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

// Цвета по специализациям
export const SPECIALIZATION_COLORS: Record<string, string> = {
  WINDOWS: '#2563eb',       // Окна - синий
  DOORS: '#9333ea',         // Двери - фиолетовый
  CEILINGS: '#16a34a',      // Потолки - зелёный
  CONDITIONERS: '#ea580c',  // Кондиционеры - оранжевый
  BLINDS: '#dc2626',        // Рольставни - красный
  FURNITURE: '#6b7280',     // Мебель - серый
};

// Время на сайте (с даты регистрации)
export function getTimeSinceRegistration(createdAt: string): string {
  const now = new Date();
  const regDate = new Date(createdAt);
  
  let years = now.getFullYear() - regDate.getFullYear();
  let months = now.getMonth() - regDate.getMonth();
  let days = now.getDate() - regDate.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) {
    const suffix = years === 1 ? 'год' : years < 5 ? 'года' : 'лет';
    parts.push(`${years} ${suffix}`);
  }
  if (months > 0) {
    const suffix = months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев';
    parts.push(`${months} ${suffix}`);
  }
  if (days > 0 && years === 0) {
    const suffix = days === 1 ? 'день' : days < 5 ? 'дня' : 'дней';
    parts.push(`${days} ${suffix}`);
  }

  return parts.length > 0 ? parts.join(' ') : 'Менее дня';
}

