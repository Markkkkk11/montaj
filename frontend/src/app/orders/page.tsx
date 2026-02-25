'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [filters, setFilters] = useState<Filters>({ region: 'Москва и обл.' });
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const requestIdRef = useRef(0);

  const loadOrders = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    try {
      setIsLoading(true);
      const result = await ordersApi.getOrders({ ...filters, page });
      if (currentRequestId !== requestIdRef.current) return;
      setOrders(result.orders);
      setTotal(result.total);
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) return;
      console.error('Error loading orders:', error);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [filters, page]);

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
  }, [user, filters, page, isHydrated, loadOrders]);

  const handleApplyFilters = (newFilters: Filters) => {
    setFilters(newFilters);
    setPage(1);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header showBack />

      <main className="container mx-auto px-4 py-8 page-enter">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-1">
              {user.role === 'CUSTOMER' ? 'Все заказы' : 'Доступные заказы'}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Search className="h-4 w-4" />
              Найдено: <strong>{total}</strong>
            </p>
          </div>
          <div className="flex gap-3 items-center">
            {user.role === 'EXECUTOR' && (
              <div className="flex bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="gap-2 rounded-lg"
                >
                  <List className="w-4 h-4" />
                  Список
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                  className="gap-2 rounded-lg"
                >
                  <Map className="w-4 h-4" />
                  Карта
                </Button>
              </div>
            )}
            {user.role === 'CUSTOMER' && (
              <Button onClick={() => router.push('/orders/create')} className="gap-2">
                Создать заказ
              </Button>
            )}
          </div>
        </div>

        {/* Предупреждение */}
        {user.role === 'EXECUTOR' && 
         user.executorProfile && 
         user.executorProfile.specializations.length === 0 && (
          <div className="mb-6 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-start gap-4 animate-fade-in">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-900">Специализации не выбраны</h3>
              <p className="text-sm text-amber-700 mt-1">
                Выберите специализации в профиле, чтобы видеть подходящие заказы.
              </p>
              <Button onClick={() => router.push('/profile/specializations')} size="sm" className="mt-3">
                Выбрать специализации
              </Button>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <OrderFilters onApply={handleApplyFilters} initialFilters={filters} />
          </div>

          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-48 skeleton rounded-2xl" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Package className="h-10 w-10 text-gray-300" />
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-1">Заказы не найдены</p>
                <p className="text-muted-foreground">Попробуйте изменить фильтры</p>
              </div>
            ) : viewMode === 'map' ? (
              <OrdersMap 
                orders={orders} 
                region={filters.region}
                onOrderSelect={(orderId) => router.push(`/orders/${orderId}`)}
              />
            ) : (
              <div className="space-y-4 stagger-children">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    showActions={user.role === 'EXECUTOR'}
                    onSelect={(orderId) => router.push(`/orders/${orderId}`)}
                  />
                ))}

                {total > 20 && (
                  <div className="flex justify-center items-center gap-3 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" /> Назад
                    </Button>
                    <div className="px-4 py-2 bg-white rounded-xl border text-sm font-medium">
                      {page} / {Math.ceil(total / 20)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= Math.ceil(total / 20)}
                      onClick={() => setPage(page + 1)}
                      className="gap-1"
                    >
                      Вперёд <ChevronRight className="h-4 w-4" />
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
