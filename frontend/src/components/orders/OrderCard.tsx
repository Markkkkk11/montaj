import Link from 'next/link';
import { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SPECIALIZATION_LABELS, SPECIALIZATION_COLORS } from '@/lib/utils';
import { Calendar, MapPin, Wallet, Users } from 'lucide-react';

interface OrderCardProps {
  order: Order;
  showActions?: boolean;
  onSelect?: (orderId: string) => void;
  isCustomer?: boolean;
}

export function OrderCard({ order, showActions = false, onSelect, isCustomer = false }: OrderCardProps) {
  const budget =
    order.budgetType === 'negotiable'
      ? 'Договорная'
      : `${parseFloat(order.budget).toLocaleString()} ₽`;

  const startDate = new Date(order.startDate).toLocaleDateString('ru-RU');

  // Определяем стиль карточки в зависимости от того, просмотрен ли заказ
  const cardClassName = order.hasViewed 
    ? "hover:shadow-lg transition-shadow opacity-50" 
    : "hover:shadow-lg transition-shadow";

  const responsesCount = order._count?.responses || 0;

  return (
    <Card className={cardClassName}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span 
                className="px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: SPECIALIZATION_COLORS[order.category] || '#6b7280' }}
              >
                {SPECIALIZATION_LABELS[order.category]}
              </span>
              {order.status !== 'PUBLISHED' && (
                <span className={`px-3 py-1 rounded-full text-sm ${
                  order.status === 'IN_PROGRESS' && !order.workStartedAt ? 'bg-yellow-100 text-yellow-700' :
                  order.status === 'IN_PROGRESS' && order.workStartedAt ? 'bg-green-100 text-green-700' :
                  order.status === 'COMPLETED' ? 'bg-gray-100 text-gray-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {order.status === 'IN_PROGRESS' && !order.workStartedAt && 'Исполнитель выбран'}
                  {order.status === 'IN_PROGRESS' && order.workStartedAt && 'В работе'}
                  {order.status === 'COMPLETED' && 'Завершён'}
                  {order.status === 'CANCELLED' && 'Отменён'}
                </span>
              )}
            </div>
            <CardTitle className="text-xl mb-2">
              {order.orderNumber ? `#${order.orderNumber} — ` : ''}{order.title}
            </CardTitle>
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

          {/* Отклики для заказчика */}
          {isCustomer && order.status === 'PUBLISHED' && (
            <div className={`p-3 rounded-lg border ${responsesCount > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className={`h-4 w-4 ${responsesCount > 0 ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className={`font-medium ${responsesCount > 0 ? 'text-green-900' : 'text-gray-600'}`}>
                    {responsesCount === 0 ? 'Нет откликов' : `${responsesCount} ${responsesCount === 1 ? 'отклик' : responsesCount < 5 ? 'отклика' : 'откликов'}`}
                  </span>
                </div>
                {responsesCount > 0 && (
                  <Link href={`/orders/${order.id}`}>
                    <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-100">
                      Смотреть
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Просто счётчик для исполнителя */}
          {!isCustomer && responsesCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{responsesCount} откликов</span>
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

