'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { CreateReviewForm } from '@/components/reviews/CreateReviewForm';
import { ordersApi } from '@/lib/api/orders';
import { reviewsApi } from '@/lib/api/reviews';
import { Order } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function CreateReviewPage() {
  const { user, isHydrated } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [canLeave, setCanLeave] = useState<{ canLeave: boolean; reason?: string; revieweeId?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) { router.push('/login'); return; }
    loadData();
  }, [user, orderId, isHydrated]);

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
    await reviewsApi.createReview({ orderId, rating, comment });
    toast({ variant: 'success', title: '⭐ Отзыв отправлен на модерацию!' });
    router.push(`/orders/${orderId}`);
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <Header showBack />
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <div className="h-64 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !order || !canLeave) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <Header showBack />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-red-600 font-semibold mb-4">{error || 'Данные не найдены'}</p>
            <Button onClick={() => router.back()} variant="outline">Вернуться назад</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!canLeave.canLeave) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <Header showBack />
        <div className="flex items-center justify-center py-20 px-4">
          <div className="text-center max-w-md">
            <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Отзыв уже оставлен</h2>
            <p className="text-muted-foreground mb-6">{canLeave.reason}</p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => router.push(`/orders/${orderId}`)} className="w-full">К заказу</Button>
              <Button variant="outline" onClick={() => router.push(user?.role === 'CUSTOMER' ? '/customer/dashboard' : '/executor/dashboard')} className="w-full">На главную</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const revieweeName = user.id === order.customerId ? order.executor?.fullName : order.customer?.fullName;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header showBack />
      <main className="container mx-auto px-4 py-8 max-w-2xl page-enter">
        <CreateReviewForm
          orderId={orderId}
          revieweeName={revieweeName || 'пользователя'}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/orders/${orderId}`)}
        />
      </main>
    </div>
  );
}
