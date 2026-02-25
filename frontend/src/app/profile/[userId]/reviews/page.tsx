'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { ReviewStats } from '@/components/reviews/ReviewStats';
import { reviewsApi } from '@/lib/api/reviews';
import { Review, ReviewStats as Stats } from '@/lib/types';
import { Star } from 'lucide-react';

export default function UserReviewsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [reviewsData, statsData] = await Promise.all([
        reviewsApi.getUserReviews(userId),
        reviewsApi.getUserReviewStats(userId),
      ]);
      setReviews(reviewsData);
      setStats(statsData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки отзывов');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header showBack />

      <main className="container mx-auto px-4 py-6 sm:py-8 page-enter">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-3">
            <Star className="h-6 w-6 sm:h-7 sm:w-7 text-amber-500" /> Отзывы
          </h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-48 skeleton rounded-2xl" />
            <div className="h-32 skeleton rounded-2xl" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-red-600 font-semibold">{error}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {stats && (
              <div className="lg:col-span-1">
                <ReviewStats stats={stats} />
              </div>
            )}
            <div className="lg:col-span-2">
              {reviews.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Star className="h-10 w-10 text-gray-300" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900 mb-1">Пока нет отзывов</p>
                  <p className="text-muted-foreground">Здесь появятся отзывы после завершения заказов</p>
                </div>
              ) : (
                <div className="space-y-4 stagger-children">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} showOrder={true} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
