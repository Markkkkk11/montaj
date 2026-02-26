'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { OrderCard } from '@/components/orders/OrderCard';
import { OrderFilters } from '@/components/orders/OrderFilters';
import { OrdersMap } from '@/components/orders/OrdersMap';
import { Header } from '@/components/layout/Header';
import { ordersApi } from '@/lib/api/orders';
import { Order, OrderFilters as Filters } from '@/lib/types';
import { List, Map, Search, ChevronLeft, ChevronRight, Package } from 'lucide-react';

export default function OrdersPage() {
  const { user, isHydrated } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({});
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role === 'CUSTOMER') {
      router.push('/customer/dashboard');
      return;
    }
    loadOrders();
  }, [user, filters, page, isHydrated]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const result = await ordersApi.getOrders({ ...filters, page });
      setOrders(result.orders);
      setTotal(result.total);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = (newFilters: Filters) => {
    setFilters(newFilters);
    setPage(1);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 overflow-x-hidden">
      <Header showBack />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 page-enter">
        <div className="mb-4 sm:mb-8 flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0">
          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-gray-900 mb-0.5 sm:mb-1">
              {user.role === 'CUSTOMER' ? 'Все заказы' : 'Доступные заказы'}
            </h1>
            <p className="text-xs sm:text-base text-muted-foreground flex items-center gap-1.5 sm:gap-2">
              <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Найдено: <strong>{total}</strong>
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3 items-center w-full sm:w-auto">
            {user.role === 'EXECUTOR' && (
              <div className="flex bg-white border border-gray-200 p-0.5 sm:p-1 rounded-lg sm:rounded-xl shadow-sm">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="gap-1 sm:gap-2 rounded-md sm:rounded-lg text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9"
                >
                  <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Список</span>
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                  className="gap-1 sm:gap-2 rounded-md sm:rounded-lg text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9"
                >
                  <Map className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Карта</span>
                </Button>
              </div>
            )}
            {user.role === 'CUSTOMER' && (
              <Button onClick={() => router.push('/orders/create')} className="gap-2 flex-1 sm:flex-none" size="sm">
                Создать заказ
              </Button>
            )}
          </div>
        </div>

        {/* Предупреждение */}
        {user.role === 'EXECUTOR' && 
         user.executorProfile && 
         user.executorProfile.specializations.length === 0 && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl sm:rounded-2xl flex items-start gap-3 sm:gap-4 animate-fade-in">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-lg sm:text-2xl">⚠️</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-amber-900 text-sm sm:text-base">Специализации не выбраны</h3>
              <p className="text-xs sm:text-sm text-amber-700 mt-0.5 sm:mt-1">
                Выберите специализации в профиле, чтобы видеть подходящие заказы.
              </p>
              <Button onClick={() => router.push('/profile/specializations')} size="sm" className="mt-2 sm:mt-3 text-xs sm:text-sm h-8 sm:h-9">
                Выбрать специализации
              </Button>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="lg:col-span-1">
            <OrderFilters onApply={handleApplyFilters} initialFilters={filters} />
          </div>

          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="space-y-3 sm:space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-36 sm:h-48 skeleton rounded-xl sm:rounded-2xl" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-10 sm:py-16">
                <div className="w-14 h-14 sm:w-20 sm:h-20 bg-gray-50 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Package className="h-7 w-7 sm:h-10 sm:w-10 text-gray-300" />
                </div>
                <p className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Заказы не найдены</p>
                <p className="text-xs sm:text-base text-muted-foreground">Попробуйте изменить фильтры</p>
              </div>
            ) : viewMode === 'map' ? (
              <OrdersMap 
                orders={orders} 
                region={filters.region}
                onOrderSelect={(orderId) => router.push(`/orders/${orderId}`)}
              />
            ) : (
              <div className="space-y-3 sm:space-y-4 stagger-children">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    showActions={user.role === 'EXECUTOR'}
                    onSelect={(orderId) => router.push(`/orders/${orderId}`)}
                  />
                ))}

                {total > 20 && (
                  <div className="flex justify-center items-center gap-2 sm:gap-3 pt-3 sm:pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="gap-0.5 sm:gap-1 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Назад</span>
                    </Button>
                    <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white rounded-lg sm:rounded-xl border text-xs sm:text-sm font-medium">
                      {page} / {Math.ceil(total / 20)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= Math.ceil(total / 20)}
                      onClick={() => setPage(page + 1)}
                      className="gap-0.5 sm:gap-1 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                    >
                      <span className="hidden sm:inline">Вперёд</span> <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
