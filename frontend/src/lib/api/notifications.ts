import api from '../api';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  channel: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  readAt?: string;
  sent: boolean;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSettings {
  id: string;
  userId: string;
  emailEnabled: boolean;
  emailOrderNew: boolean;
  emailOrderResponse: boolean;
  emailOrderSelected: boolean;
  emailOrderCompleted: boolean;
  emailReviewNew: boolean;
  emailPaymentSuccess: boolean;
  smsEnabled: boolean;
  smsOrderSelected: boolean;
  smsOrderCompleted: boolean;
  smsPaymentSuccess: boolean;
  inAppEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Получить уведомления
 */
export async function getNotifications(page: number = 1, limit: number = 20) {
  const { data } = await api.get('/notifications', {
    params: { page, limit },
  });
  return data;
}

/**
 * Получить количество непрочитанных
 */
export async function getUnreadCount(): Promise<number> {
  const { data } = await api.get('/notifications/unread-count');
  return data.count;
}

/**
 * Отметить уведомление как прочитанное
 */
export async function markAsRead(notificationId: string) {
  const { data } = await api.patch(`/notifications/${notificationId}/read`);
  return data;
}

/**
 * Отметить все как прочитанные
 */
export async function markAllAsRead() {
  const { data } = await api.post('/notifications/mark-all-read');
  return data;
}

/**
 * Удалить уведомление
 */
export async function deleteNotification(notificationId: string) {
  const { data } = await api.delete(`/notifications/${notificationId}`);
  return data;
}

/**
 * Получить настройки уведомлений
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  const { data } = await api.get('/notifications/settings');
  return data.settings;
}

/**
 * Обновить настройки уведомлений
 */
export async function updateNotificationSettings(
  settings: Partial<NotificationSettings>
) {
  const { data } = await api.put('/notifications/settings', settings);
  return data.settings;
}

