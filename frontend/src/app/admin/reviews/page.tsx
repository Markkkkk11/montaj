'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { adminApi } from '@/lib/api/admin';
import { CheckCircle, XCircle, Clock, Star, MessageSquare } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string;
  status: string;
  moderationNote?: string;
  createdAt: string;
  reviewer: {
    id: string;
    fullName: string;
    role: string;
  };
  reviewee: {
    id: string;
    fullName: string;
    role: string;
  };
  order: {
    id: string;
    title: string;
  };
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Модалка для отклонения
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Модалка для просмотра полного текста
  const [viewDialog, setViewDialog] = useState(false);
  const [viewReview, setViewReview] = useState<Review | null>(null);

  useEffect(() => {
    loadReviews();
  }, [statusFilter, page]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (statusFilter !== 'all') params.status = statusFilter;

      const data = await adminApi.getReviews(params);
      setReviews(data.reviews || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    try {
      setActionLoading(reviewId);
      await adminApi.moderateReview(reviewId, 'APPROVE');
      loadReviews();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ошибка при одобрении отзыва');
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectDialog = (reviewId: string) => {
    setSelectedReviewId(reviewId);
    setRejectNote('');
    setRejectDialog(true);
  };

  const handleReject = async () => {
    if (!selectedReviewId) return;
    try {
      setActionLoading(selectedReviewId);
      await adminApi.moderateReview(selectedReviewId, 'REJECT', rejectNote || undefined);
      setRejectDialog(false);
      setSelectedReviewId(null);
      setRejectNote('');
      loadReviews();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ошибка при отклонении отзыва');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3" />
            На модерации
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            Одобрен
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3" />
            Отклонён
          </span>
        );
      default:
        return <span className="text-xs">{status}</span>;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'CUSTOMER':
        return 'Заказчик';
      case 'EXECUTOR':
        return 'Исполнитель';
      case 'ADMIN':
        return 'Админ';
      default:
        return role;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating}</span>
      </div>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Модерация отзывов</h1>
        <p className="text-muted-foreground mt-2">
          Просмотр и модерация отзывов пользователей. Всего: {total}
        </p>
      </div>

      {/* Фильтры */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-64">
              <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Фильтр по статусу" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">⏳ На модерации</SelectItem>
                  <SelectItem value="APPROVED">✅ Одобренные</SelectItem>
                  <SelectItem value="REJECTED">❌ Отклонённые</SelectItem>
                  <SelectItem value="all">Все отзывы</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={loadReviews}>
              Обновить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Таблица отзывов */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                {statusFilter === 'PENDING'
                  ? 'Нет отзывов, ожидающих модерации'
                  : 'Отзывов не найдено'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Автор</TableHead>
                    <TableHead>Кому</TableHead>
                    <TableHead>Заказ</TableHead>
                    <TableHead>Оценка</TableHead>
                    <TableHead>Отзыв</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(review.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{review.reviewer.fullName}</div>
                          <div className="text-xs text-muted-foreground">
                            {getRoleLabel(review.reviewer.role)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{review.reviewee.fullName}</div>
                          <div className="text-xs text-muted-foreground">
                            {getRoleLabel(review.reviewee.role)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm truncate max-w-[150px] block" title={review.order.title}>
                          {review.order.title}
                        </span>
                      </TableCell>
                      <TableCell>{renderStars(review.rating)}</TableCell>
                      <TableCell>
                        <button
                          className="text-sm text-left max-w-[200px] truncate block hover:text-primary cursor-pointer"
                          title="Нажмите для просмотра полного текста"
                          onClick={() => {
                            setViewReview(review);
                            setViewDialog(true);
                          }}
                        >
                          {review.comment}
                        </button>
                      </TableCell>
                      <TableCell>{getStatusBadge(review.status)}</TableCell>
                      <TableCell className="text-right">
                        {review.status === 'PENDING' ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApprove(review.id)}
                              disabled={actionLoading === review.id}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Одобрить
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openRejectDialog(review.id)}
                              disabled={actionLoading === review.id}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Отклонить
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {review.moderationNote && `Причина: ${review.moderationNote}`}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Пагинация */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    ← Назад
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Страница {page} из {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Вперёд →
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Диалог отклонения */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отклонить отзыв</DialogTitle>
            <DialogDescription>
              Укажите причину отклонения (необязательно). Автор отзыва получит уведомление.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Причина отклонения..."
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!!actionLoading}>
              Отклонить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог просмотра отзыва */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Отзыв</DialogTitle>
          </DialogHeader>
          {viewReview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                {renderStars(viewReview.rating)}
                {getStatusBadge(viewReview.status)}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Автор: </span>
                  <span className="font-medium">{viewReview.reviewer.fullName}</span>
                  <span className="text-muted-foreground"> ({getRoleLabel(viewReview.reviewer.role)})</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Кому: </span>
                  <span className="font-medium">{viewReview.reviewee.fullName}</span>
                  <span className="text-muted-foreground"> ({getRoleLabel(viewReview.reviewee.role)})</span>
                </div>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Заказ: </span>
                <span className="font-medium">{viewReview.order.title}</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">{viewReview.comment}</p>
              </div>
              {viewReview.moderationNote && (
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-red-600">
                    <strong>Причина отклонения:</strong> {viewReview.moderationNote}
                  </p>
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Создан: {formatDate(viewReview.createdAt)}
              </div>

              {viewReview.status === 'PENDING' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      handleApprove(viewReview.id);
                      setViewDialog(false);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Одобрить
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      setViewDialog(false);
                      openRejectDialog(viewReview.id);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Отклонить
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

