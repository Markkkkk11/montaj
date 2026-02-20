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
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSettings {
  id: string;
  userId: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  // Granular email settings
  emailOrders: boolean;
  emailResponses: boolean;
  emailMessages: boolean;
  emailOrderNew: boolean;
  emailOrderResponse: boolean;
  emailOrderSelected: boolean;
  emailOrderCompleted: boolean;
  emailReviewNew: boolean;
  emailPaymentSuccess: boolean;
  // Granular SMS settings
  smsOrders: boolean;
  smsResponses: boolean;
  smsOrderSelected: boolean;
  smsOrderCompleted: boolean;
  smsPaymentSuccess: boolean;
}

export const notificationsApi = {
  /**
   * Получить уведомления
   */
  async getNotifications(page: number = 1, limit: number = 20): Promise<{
    notifications: Notification[];
    total: number;
    pages: number;
    currentPage: number;
  }> {
    const response = await api.get('/notifications', {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Получить количество непрочитанных
   */
  async getUnreadCount(): Promise<number> {
    const response = await api.get('/notifications/unread-count');
    return response.data.count;
  },

  /**
   * Отметить уведомление как прочитанное
   */
  async markAsRead(notificationId: string): Promise<void> {
    await api.patch(`/notifications/${notificationId}/read`);
  },

  /**
   * Отметить все как прочитанные
   */
  async markAllAsRead(): Promise<void> {
    await api.post('/notifications/mark-all-read');
  },

  /**
   * Удалить уведомление
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await api.delete(`/notifications/${notificationId}`);
  },

  /**
   * Получить настройки уведомлений
   */
  async getSettings(): Promise<NotificationSettings> {
    const response = await api.get('/notifications/settings');
    return response.data.settings;
  },

  /**
   * Обновить настройки уведомлений
   */
  async updateSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const response = await api.put('/notifications/settings', settings);
    return response.data.settings;
  },
};

// Named exports for backwards compatibility
export const getNotificationSettings = () => notificationsApi.getSettings();
export const updateNotificationSettings = (settings: Partial<NotificationSettings>) =>
  notificationsApi.updateSettings(settings);
