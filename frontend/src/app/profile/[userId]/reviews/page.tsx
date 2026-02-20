'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { ReviewStats } from '@/components/reviews/ReviewStats';
import { reviewsApi } from '@/lib/api/reviews';
import { Review, ReviewStats as Stats } from '@/lib/types';

export default function UserReviewsPage() {
  const { user, logout } = useAuthStore();
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

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <img src="/logo.jpg" alt="Монтаж" className="h-10 w-10 rounded-full object-cover" />
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              Назад
            </Button>
            {user && (
              <>
                <span className="text-sm text-muted-foreground">{user.fullName}</span>
                <Button variant="outline" onClick={handleLogout}>
                  Выйти
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Отзывы</h2>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Загрузка отзывов...</p>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Stats Sidebar */}
            {stats && (
              <div className="lg:col-span-1">
                <ReviewStats stats={stats} />
              </div>
            )}

            {/* Reviews List */}
            <div className="lg:col-span-2">
              {reviews.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">Пока нет отзывов</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
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

