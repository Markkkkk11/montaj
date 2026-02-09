import api from '../api';
import { Response } from '../types';

export const responsesApi = {
  // Создать отклик
  async createResponse(orderId: string) {
    const response = await api.post('/responses', { orderId });
    return response.data;
  },

  // Получить отклики на заказ
  async getOrderResponses(orderId: string) {
    const response = await api.get(`/responses/order/${orderId}`);
    return response.data.responses as Response[];
  },

  // Получить мои отклики
  async getMyResponses() {
    const response = await api.get('/responses/my');
    return response.data.responses as Response[];
  },
};

