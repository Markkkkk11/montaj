import api from '../api';

export interface Message {
  id: string;
  orderId: string;
  senderId: string;
  content: string;
  fileUrl?: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    fullName: string;
    photo?: string;
    role: 'CUSTOMER' | 'EXECUTOR' | 'ADMIN';
  };
}

export const chatApi = {
  /**
   * Получить историю сообщений
   */
  getMessages: async (orderId: string, limit = 100, offset = 0): Promise<Message[]> => {
    const response = await api.get(`/chat/${orderId}/messages`, {
      params: { limit, offset },
    });
    return response.data.messages;
  },

  /**
   * Отправить сообщение (через REST API для fallback)
   */
  sendMessage: async (
    orderId: string,
    content: string,
    fileUrl?: string
  ): Promise<Message> => {
    const response = await api.post(`/chat/${orderId}/messages`, {
      content,
      fileUrl,
    });
    return response.data.message;
  },

  /**
   * Отметить сообщения как прочитанные
   */
  markAsRead: async (orderId: string): Promise<void> => {
    await api.post(`/chat/${orderId}/mark-read`);
  },

  /**
   * Получить количество непрочитанных сообщений
   */
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/chat/unread-count');
    return response.data.count;
  },

  /**
   * Получить количество непрочитанных сообщений по заказу
   */
  getUnreadCountByOrder: async (orderId: string): Promise<number> => {
    const response = await api.get(`/chat/${orderId}/unread-count`);
    return response.data.count;
  },
};

