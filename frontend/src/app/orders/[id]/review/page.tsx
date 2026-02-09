'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { CreateReviewForm } from '@/components/reviews/CreateReviewForm';
import { ordersApi } from '@/lib/api/orders';
import { reviewsApi } from '@/lib/api/reviews';
import { Order } from '@/lib/types';

export default function CreateReviewPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [canLeave, setCanLeave] = useState<{
    canLeave: boolean;
    reason?: string;
    revieweeId?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadData();
  }, [user, orderId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [orderData, canLeaveData] = await Promise.all([
        ordersApi.getOrderById(orderId),
        reviewsApi.canLeaveReview(orderId),
      ]);
      setOrder(orderData);
      setCanLeave(canLeaveData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки данных');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (rating: number, comment: string) => {
    await reviewsApi.createReview({
      orderId,
      rating,
      comment,
    });

    alert('Отзыв отправлен на модерацию!');
    router.push(`/orders/${orderId}`);
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  if (error || !order || !canLeave) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Данные не найдены'}</p>
          <Button onClick={() => router.back()}>Вернуться назад</Button>
        </div>
      </div>
    );
  }

  if (!canLeave.canLeave) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{canLeave.reason}</p>
          <Button onClick={() => router.push(`/orders/${orderId}`)}>К заказу</Button>
        </div>
      </div>
    );
  }

  const revieweeName =
    user.id === order.customerId ? order.executor?.fullName : order.customer?.fullName;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          ← Назад
        </Button>

        <CreateReviewForm
          orderId={orderId}
          revieweeName={revieweeName || 'пользователя'}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/orders/${orderId}`)}
        />
      </div>
    </div>
  );
}

