import api from '../api';
import { Order, CreateOrderData, OrderFilters } from '../types';

export const ordersApi = {
  // Получить список заказов
  async getOrders(filters?: OrderFilters) {
    const response = await api.get('/orders', { params: filters });
    return response.data;
  },

  // Получить заказ по ID
  async getOrderById(id: string) {
    const response = await api.get(`/orders/${id}`);
    return response.data.order as Order;
  },

  // Получить мои заказы
  async getMyOrders() {
    const response = await api.get('/orders/my/list');
    return response.data.orders as Order[];
  },

  // Создать заказ
  async createOrder(data: CreateOrderData) {
    const response = await api.post('/orders', data);
    return response.data;
  },

  // Обновить заказ
  async updateOrder(id: string, data: Partial<CreateOrderData>) {
    const response = await api.put(`/orders/${id}`, data);
    return response.data;
  },

  // Отменить заказ
  async cancelOrder(id: string) {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  },

  // Выбрать исполнителя
  async selectExecutor(orderId: string, executorId: string) {
    const response = await api.post(`/orders/${orderId}/select-executor`, { executorId });
    return response.data;
  },

  // Завершить заказ
  async completeOrder(orderId: string) {
    const response = await api.post(`/orders/${orderId}/complete`);
    return response.data;
  },

  // Загрузить файлы
  async uploadFiles(orderId: string, files: File[]) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.post(`/orders/${orderId}/upload-files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.files as string[];
  },

  /**
   * Исполнитель приступает к работе
   */
  startWork: async (orderId: string): Promise<Order> => {
    const response = await api.post(`/orders/${orderId}/start-work`);
    return response.data.order;
  },

  /**
   * Исполнитель отказывается от заказа
   */
  cancelWork: async (orderId: string, reason?: string): Promise<Order> => {
    const response = await api.post(`/orders/${orderId}/cancel-work`, { reason });
    return response.data.order;
  },
};

