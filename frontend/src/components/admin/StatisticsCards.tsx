'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingCart, Star, DollarSign } from 'lucide-react';
import { Statistics } from '@/lib/api/admin';

interface StatisticsCardsProps {
  statistics: Statistics;
}

export default function StatisticsCards({ statistics }: StatisticsCardsProps) {
  return (
    <div className="grid md:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Пользователи
          </CardTitle>
          <Users className="w-4 h-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{statistics.users.total}</div>
          <div className="text-xs text-gray-500 mt-1">
            {statistics.users.executors} исполнителей, {statistics.users.customers}{' '}
            заказчиков
          </div>
          {statistics.users.pending > 0 && (
            <div className="text-xs text-orange-600 mt-1">
              На модерации: {statistics.users.pending}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Заказы</CardTitle>
          <ShoppingCart className="w-4 h-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{statistics.orders.total}</div>
          <div className="text-xs text-gray-500 mt-1">
            {statistics.orders.published} активных, {statistics.orders.completed}{' '}
            выполнено
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Отзывы</CardTitle>
          <Star className="w-4 h-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{statistics.reviews.total}</div>
          {statistics.reviews.pending > 0 && (
            <div className="text-xs text-orange-600 mt-1">
              На модерации: {statistics.reviews.pending}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Доход</CardTitle>
          <DollarSign className="w-4 h-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {statistics.revenue.total.toLocaleString('ru-RU')}₽
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Этот месяц: {statistics.revenue.thisMonth.toLocaleString('ru-RU')}₽
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

