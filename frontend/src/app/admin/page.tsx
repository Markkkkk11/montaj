'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, DollarSign, TrendingUp } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';

interface Stats {
  totalUsers: number;
  totalExecutors: number;
  totalCustomers: number;
  activeUsers: number;
  totalOrders: number;
  publishedOrders: number;
  inProgressOrders: number;
  completedOrders: number;
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
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Дашборд</h1>
        <p className="text-muted-foreground mt-2">
          Общая статистика платформы
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Исполнителей: {stats?.totalExecutors || 0} | Заказчиков: {stats?.totalCustomers || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Активные пользователи</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Со статусом ACTIVE
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Всего заказов</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              В работе: {stats?.inProgressOrders || 0} | Завершено: {stats?.completedOrders || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Доход платформы</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRevenue?.toFixed(2) || '0.00'} ₽</div>
            <p className="text-xs text-muted-foreground mt-1">
              За месяц: {stats?.monthlyRevenue?.toFixed(2) || '0.00'} ₽
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Статистика заказов</CardTitle>
            <CardDescription>Распределение по статусам</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Опубликовано</span>
                <span className="font-bold">{stats?.publishedOrders || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">В работе</span>
                <span className="font-bold">{stats?.inProgressOrders || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Завершено</span>
                <span className="font-bold">{stats?.completedOrders || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Статистика пользователей</CardTitle>
            <CardDescription>Распределение по ролям</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Исполнители</span>
                <span className="font-bold">{stats?.totalExecutors || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Заказчики</span>
                <span className="font-bold">{stats?.totalCustomers || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Активные</span>
                <span className="font-bold">{stats?.activeUsers || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
