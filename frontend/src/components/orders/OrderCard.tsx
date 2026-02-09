import Link from 'next/link';
import { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SPECIALIZATION_LABELS } from '@/lib/utils';
import { Calendar, MapPin, Wallet, Users } from 'lucide-react';

interface OrderCardProps {
  order: Order;
  showActions?: boolean;
  onSelect?: (orderId: string) => void;
}

export function OrderCard({ order, showActions = false, onSelect }: OrderCardProps) {
  const budget =
    order.budgetType === 'negotiable'
      ? 'Договорная'
      : `${parseFloat(order.budget).toLocaleString()} ₽`;

  const startDate = new Date(order.startDate).toLocaleDateString('ru-RU');

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {SPECIALIZATION_LABELS[order.category]}
              </span>
              {order.status !== 'PUBLISHED' && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {order.status === 'IN_PROGRESS' && 'В работе'}
                  {order.status === 'COMPLETED' && 'Завершён'}
                  {order.status === 'CANCELLED' && 'Отменён'}
                </span>
              )}
            </div>
            <CardTitle className="text-xl mb-2">{order.title}</CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-2">{order.description}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {order.region}, {order.address}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Начало: {startDate}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="font-semibold text-primary">{budget}</span>
          </div>

          {order._count && order._count.responses > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{order._count.responses} откликов</span>
            </div>
          )}

          {order.customer && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Заказчик: <span className="font-medium">{order.customer.fullName}</span>
                {order.customer.organization && ` (${order.customer.organization})`}
              </p>
            </div>
          )}

          {order.executor && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Исполнитель: <span className="font-medium">{order.executor.fullName}</span>
                <span className="ml-2">⭐ {order.executor.rating.toFixed(1)}</span>
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Link href={`/orders/${order.id}`} className="flex-1">
              <Button variant="outline" className="w-full">
                Подробнее
              </Button>
            </Link>
            {showActions && onSelect && (
              <Button onClick={() => onSelect(order.id)} className="flex-1">
                Откликнуться
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

