'use client';

import { useEffect, useState, useRef } from 'react';
import { Bell } from 'lucide-react';
import { notificationsApi, Notification } from '@/lib/api/notifications';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

export function NotificationBell() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Загружаем счётчик непрочитанных
  useEffect(() => {
    loadUnreadCount();
    
    // Обновляем каждые 30 секунд
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Загружаем список уведомлений при открытии
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      loadNotifications();
    }
  }, [isOpen]);

  // Убираем фокус с кнопки при закрытии
  useEffect(() => {
    if (!isOpen && buttonRef.current) {
      buttonRef.current.blur();
    }
  }, [isOpen]);

  const loadUnreadCount = async () => {
    try {
      const count = await notificationsApi.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const result = await notificationsApi.getNotifications(1, 10);
      setNotifications(result.notifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
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
    // Отмечаем как прочитанное
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    // Переходим на соответствующую страницу
    const link = getNotificationLink(notification);
    if (link) {
      setIsOpen(false);
      router.push(link);
    } else {
      // Если нет конкретной ссылки — открываем страницу уведомлений
      setIsOpen(false);
      router.push('/notifications');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER_NEW':
      case 'NEW_ORDER':
        return '📦';
      case 'NEW_RESPONSE':
      case 'ORDER_RESPONSE':
        return '✋';
      case 'RESPONSE_ACCEPTED':
      case 'ORDER_SELECTED':
        return '✅';
      case 'ORDER_STARTED':
        return '🚀';
      case 'RESPONSE_REJECTED':
      case 'ORDER_CANCELLED':
        return '❌';
      case 'ORDER_COMPLETED':
        return '🎉';
      case 'REVIEW_NEW':
      case 'REVIEW_APPROVED':
        return '⭐';
      case 'NEW_MESSAGE':
        return '💬';
      case 'BALANCE_LOW':
        return '💰';
      case 'USER_APPROVED':
        return '👤';
      case 'ADMIN_MESSAGE':
      case 'SYSTEM':
        return '⚙️';
      default:
        return '🔔';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button ref={buttonRef} variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-80 max-h-[500px] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Уведомления</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto py-1 px-2"
              onClick={handleMarkAllAsRead}
            >
              Прочитать все
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Загрузка...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Нет уведомлений
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
                onSelect={(e) => {
                  e.preventDefault();
                  handleNotificationClick(notification);
                }}
              >
                <div className="flex items-start gap-2 w-full">
                  <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </p>
                  </div>
                  {!notification.read && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-center text-sm text-primary cursor-pointer justify-center"
              onSelect={(e) => {
                e.preventDefault();
                setIsOpen(false);
                router.push('/notifications');
              }}
            >
              Показать все уведомления
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
