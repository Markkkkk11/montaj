import Link from 'next/link';
import { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SPECIALIZATION_LABELS, SPECIALIZATION_COLORS } from '@/lib/utils';
import { Calendar, MapPin, Wallet, Users, ChevronRight } from 'lucide-react';

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

  const cardClassName = order.hasViewed 
    ? "hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-0.5 opacity-60" 
    : "hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-0.5";

  const responsesCount = order._count?.responses || 0;

  return (
    <Card className={cardClassName}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span 
                className="px-3 py-1 rounded-xl text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: SPECIALIZATION_COLORS[order.category] || '#6b7280' }}
              >
                {SPECIALIZATION_LABELS[order.category]}
              </span>
              {order.status !== 'PUBLISHED' && (
                <span className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                  order.status === 'PENDING' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                  order.status === 'IN_PROGRESS' && !order.workStartedAt ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                  order.status === 'IN_PROGRESS' && order.workStartedAt ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                  order.status === 'COMPLETED' ? 'bg-gray-50 text-gray-600 border border-gray-100' :
                  'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  {order.status === 'PENDING' && 'На модерации'}
                  {order.status === 'IN_PROGRESS' && !order.workStartedAt && 'Исполнитель выбран'}
                  {order.status === 'IN_PROGRESS' && order.workStartedAt && 'В работе'}
                  {order.status === 'COMPLETED' && 'Завершён'}
                  {order.status === 'CANCELLED' && 'Отменён'}
                </span>
              )}
            </div>
            <CardTitle className="text-lg mb-1.5 truncate">
              {order.orderNumber ? `#${order.orderNumber} — ` : ''}{order.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{order.description}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{order.region}, {order.address}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground flex-shrink-0">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{startDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-xl">
              <Wallet className="h-4 w-4 text-blue-600" />
              <span className="font-bold text-blue-700 text-sm">{budget}</span>
            </div>
          </div>

          {/* Отклики для заказчика */}
          {isCustomer && order.status === 'PUBLISHED' && (
            <div className={`p-3 rounded-xl border ${responsesCount > 0 ? 'bg-emerald-50/50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className={`h-4 w-4 ${responsesCount > 0 ? 'text-emerald-600' : 'text-gray-400'}`} />
                  <span className={`text-sm font-semibold ${responsesCount > 0 ? 'text-emerald-800' : 'text-gray-600'}`}>
                    {responsesCount === 0 ? 'Нет откликов' : `${responsesCount} ${responsesCount === 1 ? 'отклик' : responsesCount < 5 ? 'отклика' : 'откликов'}`}
                  </span>
                </div>
                {responsesCount > 0 && (
                  <Link href={`/orders/${order.id}`}>
                    <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-100 gap-1 h-8">
                      Смотреть <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Просто счётчик для исполнителя */}
          {!isCustomer && responsesCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>{responsesCount} откликов</span>
            </div>
          )}

          {order.customer && (
            <div className="pt-3 border-t border-gray-50">
              <p className="text-xs text-muted-foreground">
                Заказчик: <span className="font-semibold text-gray-700">{order.customer.fullName}</span>
                {order.customer.organization && ` (${order.customer.organization})`}
              </p>
            </div>
          )}

          {order.executor && (
            <div className="pt-3 border-t border-gray-50">
              <p className="text-xs text-muted-foreground">
                Исполнитель: <span className="font-semibold text-gray-700">{order.executor.fullName}</span>
                <span className="ml-2">⭐ {order.executor.rating.toFixed(1)}</span>
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Link href={`/orders/${order.id}`} className="flex-1">
              <Button variant="outline" className="w-full gap-1" size="sm">
                Подробнее <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            {showActions && onSelect && (
              <Button onClick={() => onSelect(order.id)} className="flex-1" size="sm">
                Откликнуться
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
