'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { notificationsApi, Notification } from '@/lib/api/notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export default function NotificationsPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadNotifications();
  }, [user, page]);

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

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
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

  const handleNotificationClick = (notification: Notification) => {
    // Отмечаем как прочитанное
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    // Переходим на соответствующую страницу
    if (notification.data?.orderId) {
      router.push(`/orders/${notification.data.orderId}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'NEW_ORDER':
        return '📦';
      case 'NEW_RESPONSE':
      case 'ORDER_RESPONSE':
        return '✋';
      case 'RESPONSE_ACCEPTED':
      case 'ORDER_SELECTED':
        return '✅';
      case 'RESPONSE_REJECTED':
        return '❌';
      case 'ORDER_COMPLETED':
        return '🎉';
      case 'NEW_MESSAGE':
        return '💬';
      case 'ADMIN_MESSAGE':
        return '⚙️';
      default:
        return '🔔';
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'NEW_ORDER':
        return 'Новый заказ';
      case 'NEW_RESPONSE':
      case 'ORDER_RESPONSE':
        return 'Новый отклик';
      case 'RESPONSE_ACCEPTED':
      case 'ORDER_SELECTED':
        return 'Вас выбрали';
      case 'RESPONSE_REJECTED':
        return 'Отклик отклонён';
      case 'ORDER_COMPLETED':
        return 'Заказ завершён';
      case 'NEW_MESSAGE':
        return 'Новое сообщение';
      case 'ADMIN_MESSAGE':
        return 'Сообщение от администрации';
      default:
        return 'Уведомление';
    }
  };

  if (!user) {
    return null;
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Монтаж</h1>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <span className="text-sm text-muted-foreground">{user.fullName}</span>
            <Button variant="outline" onClick={handleLogout}>
              Выйти
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold">Уведомления</h2>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  Непрочитанных: {unreadCount}
                </p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
              Прочитать все
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Загрузка уведомлений...</p>
          </div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">У вас пока нет уведомлений</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`cursor-pointer transition-colors ${
                  !notification.read ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                          {notification.title}
                        </p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notification.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground mb-2 inline-block">
                        {getNotificationTypeLabel(notification.type)}
                      </span>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: ru,
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Пагинация */}
        {total > 20 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Назад
            </Button>
            <span className="py-2 px-4 text-sm">
              Страница {page} из {Math.ceil(total / 20)}
            </span>
            <Button
              variant="outline"
              disabled={page >= Math.ceil(total / 20)}
              onClick={() => setPage((p) => p + 1)}
            >
              Вперёд
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
