import { Review } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Star, User } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface ReviewCardProps {
  review: Review;
  showOrder?: boolean;
}

export function ReviewCard({ review, showOrder = false }: ReviewCardProps) {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getPhotoUrl = (photo?: string) => {
    if (!photo) return null;
    return photo.startsWith('/') ? `${API_URL}${photo}` : photo;
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.charAt(0).toUpperCase();
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {review.reviewer?.photo ? (
              <>
                <img
                  src={getPhotoUrl(review.reviewer.photo)!}
                  alt={review.reviewer.fullName}
                  className="h-12 w-12 rounded-full object-cover border-2 border-gray-100"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 hidden items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {getInitials(review.reviewer?.fullName)}
                  </span>
                </div>
              </>
            ) : (
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {getInitials(review.reviewer?.fullName)}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-semibold text-sm">
                  {review.reviewer?.fullName}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {review.reviewer?.role === 'CUSTOMER' ? 'Заказчик' : 'Исполнитель'}
                  </span>
                </h4>
                <div className="flex items-center gap-1 mt-1">
                  {renderStars(review.rating)}
                </div>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(review.createdAt).toLocaleDateString('ru-RU')}
              </span>
            </div>

            {showOrder && review.order && (
              <p className="text-sm text-muted-foreground mb-2">
                Заказ: {review.order.title}
              </p>
            )}

            <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.comment}</p>

            {review.status === 'PENDING' && (
              <div className="mt-2 inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                На модерации
              </div>
            )}

            {review.status === 'REJECTED' && (
              <div className="mt-2">
                <div className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                  Отклонён
                </div>
                {review.moderationNote && (
                  <p className="text-xs text-red-600 mt-1">Причина: {review.moderationNote}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

