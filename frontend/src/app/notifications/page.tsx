'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { notificationsApi, Notification } from '@/lib/api/notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Bell, CheckCheck, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

export default function NotificationsPage() {
  const { user, isHydrated } = useAuthStore();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) { router.push('/login'); return; }
    loadNotifications();
  }, [user, page, isHydrated]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const result = await notificationsApi.getNotifications(page, 20);
      setNotifications(result.notifications);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationsApi.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setTotal((prev) => prev - 1);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationLink = (notification: Notification): string | null => {
    const data = notification.data;
    if (data?.orderId) return `/orders/${data.orderId}`;

    switch (notification.type) {
      case 'BALANCE_LOW':
      case 'PAYMENT_SUCCESS':
        return '/profile/balance';
      case 'USER_APPROVED':
        return '/profile';
      default:
        return null;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) handleMarkAsRead(notification.id);
    setSelectedNotification(notification);
  };

  const handleGoToLink = () => {
    if (!selectedNotification) return;
    const link = getNotificationLink(selectedNotification);
    if (link) {
      setSelectedNotification(null);
      router.push(link);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER_NEW': case 'NEW_ORDER': return '📦';
      case 'NEW_RESPONSE': case 'ORDER_RESPONSE': return '✋';
      case 'RESPONSE_ACCEPTED': case 'ORDER_SELECTED': return '✅';
      case 'ORDER_STARTED': return '🚀';
      case 'RESPONSE_REJECTED': case 'ORDER_CANCELLED': return '❌';
      case 'ORDER_COMPLETED': return '🎉';
      case 'REVIEW_NEW': case 'REVIEW_APPROVED': return '⭐';
      case 'NEW_MESSAGE': return '💬';
      case 'BALANCE_LOW': return '💰';
      case 'USER_APPROVED': return '👤';
      case 'ADMIN_MESSAGE': case 'SYSTEM': return '⚙️';
      default: return '🔔';
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'ORDER_NEW': case 'NEW_ORDER': return 'Новый заказ';
      case 'NEW_RESPONSE': case 'ORDER_RESPONSE': return 'Новый отклик';
      case 'RESPONSE_ACCEPTED': case 'ORDER_SELECTED': return 'Вас выбрали';
      case 'ORDER_STARTED': return 'Работа начата';
      case 'RESPONSE_REJECTED': return 'Отклик отклонён';
      case 'ORDER_CANCELLED': return 'Заказ отменён';
      case 'ORDER_COMPLETED': return 'Заказ завершён';
      case 'REVIEW_NEW': return 'Новый отзыв';
      case 'REVIEW_APPROVED': return 'Отзыв опубликован';
      case 'NEW_MESSAGE': return 'Новое сообщение';
      case 'BALANCE_LOW': return 'Низкий баланс';
      case 'USER_APPROVED': return 'Профиль одобрен';
      case 'ADMIN_MESSAGE': case 'SYSTEM': return 'Системное';
      default: return 'Уведомление';
    }
  };

  if (!user) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header showBack />

      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl page-enter">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-3">
              <Bell className="h-6 w-6 sm:h-7 sm:w-7" /> Уведомления
            </h1>
              {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Непрочитанных: <strong className="text-blue-600">{unreadCount}</strong>
                </p>
              )}
          </div>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline" size="sm" className="gap-2">
              <CheckCheck className="h-4 w-4" /> Прочитать все
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 skeleton rounded-2xl" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bell className="h-10 w-10 text-gray-300" />
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-1">Нет уведомлений</p>
            <p className="text-muted-foreground">Здесь будут появляться новые уведомления</p>
          </div>
        ) : (
          <div className="space-y-2 stagger-children">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft-lg ${
                  !notification.read ? 'bg-blue-50/80 border-blue-100 ring-1 ring-blue-100' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-soft flex-shrink-0 text-xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notification.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {notification.title}
                        </p>
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                            {getNotificationTypeLabel(notification.type)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-300 hover:text-red-500"
                            onClick={(e) => { e.stopPropagation(); handleDelete(notification.id); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ru })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {total > 20 && (
          <div className="flex justify-center items-center gap-3 mt-8">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="gap-1">
              <ChevronLeft className="h-4 w-4" /> Назад
            </Button>
            <div className="px-4 py-2 bg-white rounded-xl border text-sm font-medium">
              {page} / {Math.ceil(total / 20)}
            </div>
            <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)} className="gap-1">
              Вперёд <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Модальное окно просмотра уведомления */}
        <Dialog open={!!selectedNotification} onOpenChange={(open) => { if (!open) setSelectedNotification(null); }}>
          <DialogContent className="max-w-md sm:max-w-lg rounded-2xl p-0 gap-0 overflow-hidden [&>button:last-child]:hidden">
            {selectedNotification && (
              <>
                {/* Шапка */}
                <div className="bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-4 text-white relative">
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <span className="sr-only">Закрыть</span>
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                      {getNotificationIcon(selectedNotification.type)}
                    </div>
                    <div className="min-w-0">
                      <DialogHeader>
                        <DialogTitle className="text-white text-base font-bold leading-tight">
                          {selectedNotification.title}
                        </DialogTitle>
                      </DialogHeader>
                      <p className="text-blue-100 text-xs mt-0.5">
                        {getNotificationTypeLabel(selectedNotification.type)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Содержимое */}
                <div className="px-5 py-5 space-y-4">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedNotification.message}
                  </p>

                  {/* Дополнительные данные */}
                  {selectedNotification.data && Object.keys(selectedNotification.data).length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                      {selectedNotification.data.orderTitle && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Заказ:</span>
                          <span className="font-medium text-gray-900">{selectedNotification.data.orderTitle}</span>
                        </div>
                      )}
                      {selectedNotification.data.executorName && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Исполнитель:</span>
                          <span className="font-medium text-gray-900">{selectedNotification.data.executorName}</span>
                        </div>
                      )}
                      {selectedNotification.data.customerName && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Заказчик:</span>
                          <span className="font-medium text-gray-900">{selectedNotification.data.customerName}</span>
                        </div>
                      )}
                      {selectedNotification.data.customerPhone && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Телефон:</span>
                          <a href={`tel:${selectedNotification.data.customerPhone}`} className="font-medium text-blue-600 hover:underline">
                            {selectedNotification.data.customerPhone}
                          </a>
                        </div>
                      )}
                      {selectedNotification.data.rating && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Оценка:</span>
                          <span className="font-medium text-gray-900">{'⭐'.repeat(selectedNotification.data.rating)}</span>
                        </div>
                      )}
                      {selectedNotification.data.reviewerName && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">От:</span>
                          <span className="font-medium text-gray-900">{selectedNotification.data.reviewerName}</span>
                        </div>
                      )}
                      {selectedNotification.data.amount && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Сумма:</span>
                          <span className="font-medium text-gray-900">{selectedNotification.data.amount} ₽</span>
                        </div>
                      )}
                      {selectedNotification.data.balance !== undefined && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Баланс:</span>
                          <span className="font-medium text-gray-900">{selectedNotification.data.balance} ₽</span>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {new Date(selectedNotification.createdAt).toLocaleString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Кнопки */}
                <div className="border-t px-5 py-3 bg-gray-50/80 flex gap-2">
                  {getNotificationLink(selectedNotification) && (
                    <Button onClick={handleGoToLink} className="flex-1 gap-2" size="sm">
                      <ExternalLink className="h-4 w-4" /> Перейти
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedNotification(null)}
                  >
                    Закрыть
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
