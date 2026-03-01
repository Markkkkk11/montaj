import api from '../api';

export interface Statistics {
  users: {
    total: number;
    executors: number;
    customers: number;
    pending: number;
  };
  orders: {
    total: number;
    published: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  reviews: {
    total: number;
    pending: number;
    approved: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
  };
}

export const adminApi = {
  // Статистика
  async getStats() {
    const { data } = await api.get('/admin/stats');
    return data;
  },

  // Пользователи
  async getUsers(params?: { page?: number; limit?: number; role?: string; status?: string }) {
    const { data } = await api.get('/admin/users', { params });
    return data;
  },

  async getUser(userId: string) {
    const { data } = await api.get(`/admin/users/${userId}`);
    return data;
  },

  async getUserActivity(userId: string) {
    const { data } = await api.get(`/admin/users/${userId}/activity`);
    return data;
  },

  async updateUser(userId: string, updates: any) {
    const { data } = await api.patch(`/admin/users/${userId}`, updates);
    return data;
  },

  async deleteUser(userId: string) {
    const { data } = await api.delete(`/admin/users/${userId}`);
    return data;
  },

  async updateUserBalance(userId: string, amount: number, bonusAmount: number) {
    const { data } = await api.patch(`/admin/users/${userId}/balance`, {
      amount,
      bonusAmount,
    });
    return data;
  },

  async updateUserSubscription(userId: string, subscription: any) {
    const { data } = await api.patch(`/admin/users/${userId}/subscription`, subscription);
    return data;
  },

  // Заказы
  async getOrders(params?: { page?: number; limit?: number; status?: string }) {
    const { data } = await api.get('/admin/orders', { params });
    return data;
  },

  async getOrder(orderId: string) {
    const { data } = await api.get(`/admin/orders/${orderId}`);
    return data;
  },

  async updateOrder(orderId: string, updates: any) {
    const { data } = await api.patch(`/admin/orders/${orderId}`, updates);
    return data;
  },

  async deleteOrder(orderId: string) {
    const { data } = await api.delete(`/admin/orders/${orderId}`);
    return data;
  },

  // Отзывы (модерация)
  async getReviews(params?: { page?: number; limit?: number; status?: string }) {
    const { data } = await api.get('/admin/reviews', { params });
    return data;
  },

  async moderateReview(reviewId: string, action: 'APPROVE' | 'REJECT', note?: string) {
    const { data } = await api.post(`/admin/reviews/${reviewId}/moderate`, { action, note });
    return data;
  },

  // История пополнений
  async getPaymentHistory(params?: { startDate?: string; endDate?: string; page?: number; limit?: number }) {
    const { data } = await api.get('/admin/payments', { params });
    return data;
  },
};
