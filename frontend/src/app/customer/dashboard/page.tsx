'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderCard } from '@/components/orders/OrderCard';
import { Header } from '@/components/layout/Header';
import { ordersApi } from '@/lib/api/orders';
import { Order } from '@/lib/types';
import { Plus, FileText, User, Star, Mail, MessageCircle, ArrowRight, TrendingUp, Package } from 'lucide-react';

export default function CustomerDashboard() {
  const { user, isHydrated } = useAuthStore();
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

  const activeOrders = myOrders.filter(o => o.status === 'PUBLISHED' || o.status === 'IN_PROGRESS');
  const completedOrders = myOrders.filter(o => o.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />

      <main className="container mx-auto px-4 py-8 page-enter">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-1">
            Добро пожаловать, {user.fullName?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground">
            Управляйте заказами и следите за их выполнением
          </p>
        </div>

        {/* Status Info */}
        {user.status === 'PENDING' && (
          <div className="mb-6 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl animate-fade-in flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">⏳</span>
            </div>
            <div>
              <h3 className="font-bold text-amber-900">Профиль на модерации</h3>
              <p className="text-sm text-amber-700 mt-1">
                Ваш профиль проверяется администратором. Это может занять до 24 часов.
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 stagger-children">
          <Card className="overflow-hidden hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-0.5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Активные заказы</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-1">{activeOrders.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(activeOrders.length * 20, 100)}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-0.5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Завершено</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-1">{user.completedOrders}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(user.completedOrders * 10, 100)}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-0.5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Рейтинг</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-1">{user.rating.toFixed(1)}</p>
                </div>
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                  <Star className="h-6 w-6 text-amber-500" />
                </div>
              </div>
              <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500" style={{ width: `${(user.rating / 5) * 100}%` }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-8 stagger-children">
          <Card
            className="cursor-pointer group hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 border-2 border-transparent hover:border-blue-200 overflow-hidden"
            onClick={() => router.push('/orders/create')}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Создать заказ</CardTitle>
                  <CardDescription className="text-xs">Новая заявка на монтаж</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full gap-2" size="sm">
                Создать <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer group hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 border-2 border-transparent hover:border-violet-200 overflow-hidden"
            onClick={() => router.push('/profile')}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-violet-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <User className="h-6 w-6 text-violet-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Мой профиль</CardTitle>
                  <CardDescription className="text-xs">Просмотр и редактирование</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" size="sm">
                Перейти
              </Button>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer group hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 border-2 border-transparent hover:border-amber-200 overflow-hidden"
            onClick={() => router.push(`/profile/${user.id}/reviews`)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Star className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-base">Мои отзывы</CardTitle>
                  <CardDescription className="text-xs">Рейтинг {user.rating.toFixed(1)}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" size="sm">
                Смотреть
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Feedback */}
        <div className="mb-8 p-4 bg-white rounded-2xl border border-gray-100 shadow-soft flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-gray-400" />
            </div>
            <span className="text-sm font-semibold text-gray-600">Обратная связь:</span>
          </div>
          <div className="flex gap-4">
            <a href="mailto:SVMontaj24@yandex.ru" className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium">
              <Mail className="h-4 w-4" /> Email
            </a>
            <a href="https://t.me/SVMontaj24" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-violet-600 hover:underline font-medium">
              <MessageCircle className="h-4 w-4" /> Telegram
            </a>
          </div>
        </div>

        {/* Active Orders */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="section-title">Активные заказы</h2>
                <p className="section-subtitle">{activeOrders.length} активных</p>
              </div>
            </div>
            {isLoading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[1, 2].map(i => (
                  <div key={i} className="h-48 skeleton rounded-2xl" />
                ))}
              </div>
            ) : activeOrders.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Package className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="text-muted-foreground mb-4">У вас пока нет активных заказов</p>
                  <Button onClick={() => router.push('/orders/create')} className="gap-2">
                    <Plus className="h-4 w-4" /> Создать первый заказ
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4 stagger-children">
                {activeOrders.map((order) => (
                  <OrderCard key={order.id} order={order} isCustomer={true} />
                ))}
              </div>
            )}
          </div>

          {completedOrders.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="section-title">Завершённые заказы</h2>
                  <p className="section-subtitle">{completedOrders.length} завершённых</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 stagger-children">
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
