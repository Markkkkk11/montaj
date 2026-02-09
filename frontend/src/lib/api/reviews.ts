import api from '../api';
import { Review, CreateReviewData, ReviewStats } from '../types';

export const reviewsApi = {
  // Создать отзыв
  async createReview(data: CreateReviewData) {
    const response = await api.post('/reviews', data);
    return response.data;
  },

  // Получить отзывы о пользователе
  async getUserReviews(userId: string) {
    const response = await api.get(`/reviews/user/${userId}`);
    return response.data.reviews as Review[];
  },

  // Получить мои отзывы
  async getMyReviews() {
    const response = await api.get('/reviews/my');
    return response.data.reviews as Review[];
  },

  // Получить отзыв по ID
  async getReviewById(id: string) {
    const response = await api.get(`/reviews/${id}`);
    return response.data.review as Review;
  },

  // Проверить, может ли пользователь оставить отзыв
  async canLeaveReview(orderId: string) {
    const response = await api.get(`/reviews/order/${orderId}/can-leave`);
    return response.data as { canLeave: boolean; reason?: string; revieweeId?: string };
  },

  // Получить статистику отзывов
  async getUserReviewStats(userId: string) {
    const response = await api.get(`/reviews/user/${userId}/stats`);
    return response.data.stats as ReviewStats;
  },

  // Получить отзывы на модерации (админ)
  async getPendingReviews(page: number = 1, limit: number = 20) {
    const response = await api.get('/reviews/pending', { params: { page, limit } });
    return response.data;
  },

  // Модерировать отзыв (админ)
  async moderateReview(reviewId: string, action: 'approve' | 'reject', note?: string) {
    const response = await api.post(`/reviews/${reviewId}/moderate`, { action, note });
    return response.data;
  },
};

