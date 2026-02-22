'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderCard } from '@/components/orders/OrderCard';
import { ordersApi } from '@/lib/api/orders';
import { Order } from '@/lib/types';
import { Plus, FileText, User, MessageSquare, Star } from 'lucide-react';
import Link from 'next/link';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export default function CustomerDashboard() {
  const { user, logout, isHydrated } = useAuthStore();
  const router = useRouter();
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role === 'ADMIN') {
      router.push('/admin');
      return;
    }
    if (user.role === 'EXECUTOR') {
      router.push('/executor/dashboard');
      return;
    }
    loadMyOrders();
  }, [user, router, isHydrated]);

  const loadMyOrders = async () => {
    try {
      setIsLoading(true);
      const orders = await ordersApi.getMyOrders();
      setMyOrders(orders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isHydrated || !user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const activeOrders = myOrders.filter(o => o.status === 'PUBLISHED' || o.status === 'IN_PROGRESS');
  const completedOrders = myOrders.filter(o => o.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/customer/dashboard')}>
            <img src="/logo.jpg" alt="Монтаж" className="h-12 w-12 rounded-lg object-cover shadow-sm" />
            <span className="text-xl font-bold text-primary hidden sm:inline">Монтаж</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors hidden sm:inline">
              Обратная связь
            </Link>
            <NotificationBell />
            <span className="text-sm text-muted-foreground">{user.fullName}</span>
            <Button variant="outline" onClick={handleLogout}>
              Выйти
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Личный кабинет заказчика</h2>
          <p className="text-muted-foreground">
            Добро пожаловать, {user.fullName}! Статус: {user.status}
          </p>
        </div>

        {/* Status Info */}
        {user.status === 'PENDING' && (
          <Card className="mb-6 bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle>Профиль на модерации</CardTitle>
              <CardDescription>
                Ваш профиль проверяется администратором. Это может занять до 24 часов.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Мои заказы</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{activeOrders.length}</p>
              <p className="text-sm text-muted-foreground">Активных заказов</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Завершено</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{user.completedOrders}</p>
              <p className="text-sm text-muted-foreground">Выполненных заказов</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/profile/${user.id}/reviews`)}>
            <CardHeader>
              <CardTitle className="text-lg">Рейтинг и отзывы</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{user.rating.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Средняя оценка</p>
              <p className="text-xs text-primary mt-2 hover:underline">Посмотреть отзывы →</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/orders/create')}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                <CardTitle>Создать заказ</CardTitle>
              </div>
              <CardDescription>
                Разместите новую заявку на монтажные работы
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Создать заказ
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/profile')}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Мой профиль</CardTitle>
              </div>
              <CardDescription>
                Просмотреть и редактировать профиль
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Перейти в профиль
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/profile/${user.id}/reviews`)}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                <CardTitle>Мои отзывы</CardTitle>
              </div>
              <CardDescription>
                Посмотреть отзывы о вас
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Перейти к отзывам
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* My Orders Section */}
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold mb-4">Активные заказы ({activeOrders.length})</h3>
            {isLoading ? (
              <p className="text-muted-foreground">Загрузка...</p>
            ) : activeOrders.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">У вас пока нет активных заказов</p>
                  <Button onClick={() => router.push('/orders/create')}>
                    Создать первый заказ
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {activeOrders.map((order) => (
                  <OrderCard key={order.id} order={order} isCustomer={true} />
                ))}
              </div>
            )}
          </div>

          {completedOrders.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold mb-4">Завершённые заказы ({completedOrders.length})</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {completedOrders.slice(0, 4).map((order) => (
                  <OrderCard key={order.id} order={order} isCustomer={true} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
