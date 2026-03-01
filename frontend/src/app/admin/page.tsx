'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, DollarSign, TrendingUp, MessageSquare, Star, UserCheck } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import Link from 'next/link';

interface Stats {
  totalUsers: number;
  totalExecutors: number;
  totalCustomers: number;
  activeUsers: number;
  pendingUsers: number;
  totalOrders: number;
  publishedOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  totalReviews: number;
  pendingReviews: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Дашборд</h1>
        <p className="text-muted-foreground mt-2">
          Общая статистика платформы
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Пользователи</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Исп: {stats?.totalExecutors || 0} / Зак: {stats?.totalCustomers || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Активные</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              На модерации: {stats?.pendingUsers || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Заказы</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              В работе: {stats?.inProgressOrders || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Отзывы</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReviews || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              На модерации: {stats?.pendingReviews || 0}
            </p>
          </CardContent>
        </Card>

        <Link href="/admin/payments">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Доход</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRevenue?.toFixed(0) || '0'} ₽</div>
            <p className="text-xs text-muted-foreground mt-1">
              Мес: {stats?.monthlyRevenue?.toFixed(0) || '0'} ₽
            </p>
          </CardContent>
        </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Завершено</CardTitle>
            <UserCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedOrders || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Опубл: {stats?.publishedOrders || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Баннеры-предупреждения */}
      <div className="space-y-3 mb-8">
        {(stats?.pendingReviews ?? 0) > 0 && (
          <Link href="/admin/reviews">
            <Card className="border-yellow-200 bg-yellow-50 hover:bg-yellow-100 transition-colors cursor-pointer">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-yellow-200 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-5 w-5 text-yellow-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-yellow-800">
                      {stats?.pendingReviews} {stats?.pendingReviews === 1 ? 'отзыв ожидает' : 'отзывов ожидают'} модерации
                    </p>
                    <p className="text-sm text-yellow-600">Нажмите, чтобы перейти к модерации</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
        {(stats?.pendingUsers ?? 0) > 0 && (
          <Link href="/admin/users">
            <Card className="border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer mt-3">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-800">
                      {stats?.pendingUsers} {stats?.pendingUsers === 1 ? 'пользователь ожидает' : 'пользователей ожидают'} проверки
                    </p>
                    <p className="text-sm text-blue-600">Нажмите для просмотра</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      {/* Детальная статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Статистика заказов</CardTitle>
            <CardDescription>Распределение по статусам</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-sm">Опубликовано</span>
                </div>
                <span className="font-bold">{stats?.publishedOrders || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span className="text-sm">В работе</span>
                </div>
                <span className="font-bold">{stats?.inProgressOrders || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Завершено</span>
                </div>
                <span className="font-bold">{stats?.completedOrders || 0}</span>
              </div>
            </div>
            {stats && (stats.totalOrders > 0) && (
              <div className="mt-4 h-3 rounded-full overflow-hidden bg-gray-100 flex">
                {stats.publishedOrders > 0 && (
                  <div className="bg-blue-500 h-full" style={{ width: `${(stats.publishedOrders / stats.totalOrders) * 100}%` }} />
                )}
                {stats.inProgressOrders > 0 && (
                  <div className="bg-yellow-500 h-full" style={{ width: `${(stats.inProgressOrders / stats.totalOrders) * 100}%` }} />
                )}
                {stats.completedOrders > 0 && (
                  <div className="bg-green-500 h-full" style={{ width: `${(stats.completedOrders / stats.totalOrders) * 100}%` }} />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Статистика пользователей</CardTitle>
            <CardDescription>Распределение по ролям</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-sm">Исполнители</span>
                </div>
                <span className="font-bold">{stats?.totalExecutors || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Заказчики</span>
                </div>
                <span className="font-bold">{stats?.totalCustomers || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-sm">Активные</span>
                </div>
                <span className="font-bold">{stats?.activeUsers || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-orange-500" />
                  <span className="text-sm">На модерации</span>
                </div>
                <span className="font-bold">{stats?.pendingUsers || 0}</span>
              </div>
            </div>
            {stats && (stats.totalUsers > 0) && (
              <div className="mt-4 h-3 rounded-full overflow-hidden bg-gray-100 flex">
                {stats.totalExecutors > 0 && (
                  <div className="bg-blue-500 h-full" style={{ width: `${(stats.totalExecutors / stats.totalUsers) * 100}%` }} />
                )}
                {stats.totalCustomers > 0 && (
                  <div className="bg-green-500 h-full" style={{ width: `${(stats.totalCustomers / stats.totalUsers) * 100}%` }} />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
