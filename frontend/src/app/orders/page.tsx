'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { OrderCard } from '@/components/orders/OrderCard';
import { OrderFilters } from '@/components/orders/OrderFilters';
import { OrdersMap } from '@/components/orders/OrdersMap';
import { ordersApi } from '@/lib/api/orders';
import { Order, OrderFilters as Filters } from '@/lib/types';
import { List, Map } from 'lucide-react';

export default function OrdersPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({});
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadOrders();
  }, [user, filters, page]);

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

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const goBack = () => {
    if (user?.role === 'CUSTOMER') {
      router.push('/customer/dashboard');
    } else {
      router.push('/executor/dashboard');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Монтаж</h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={goBack}>
              Назад
            </Button>
            <span className="text-sm text-muted-foreground">{user.fullName}</span>
            <Button variant="outline" onClick={handleLogout}>
              Выйти
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              {user.role === 'CUSTOMER' ? 'Все заказы' : 'Доступные заказы'}
            </h2>
            <p className="text-muted-foreground">
              Найдено заказов: {total}
            </p>
          </div>
          <div className="flex gap-3 items-center">
            {/* Переключатель вида для исполнителей */}
            {user.role === 'EXECUTOR' && (
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="gap-2"
                >
                  <List className="w-4 h-4" />
                  Список
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                  className="gap-2"
                >
                  <Map className="w-4 h-4" />
                  Карта
                </Button>
              </div>
            )}
            {user.role === 'CUSTOMER' && (
              <Button onClick={() => router.push('/orders/create')}>
                Создать заказ
              </Button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          {viewMode === 'list' && (
            <div className="lg:col-span-1">
              <OrderFilters onApply={handleApplyFilters} initialFilters={filters} />
            </div>
          )}

          {/* Orders List or Map */}
          <div className={viewMode === 'list' ? 'lg:col-span-3' : 'lg:col-span-4'}>
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Загрузка заказов...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Заказы не найдены</p>
                {user.role === 'CUSTOMER' && (
                  <Button className="mt-4" onClick={() => router.push('/orders/create')}>
                    Создать первый заказ
                  </Button>
                )}
              </div>
            ) : viewMode === 'map' ? (
              /* Map View */
              <OrdersMap 
                orders={orders} 
                onOrderSelect={(orderId) => router.push(`/orders/${orderId}`)}
              />
            ) : (
              /* List View */
              <div className="space-y-4">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    showActions={user.role === 'EXECUTOR'}
                    onSelect={(orderId) => router.push(`/orders/${orderId}`)}
                  />
                ))}

                {/* Pagination */}
                {total > 20 && (
                  <div className="flex justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Назад
                    </Button>
                    <span className="px-4 py-2">
                      Страница {page} из {Math.ceil(total / 20)}
                    </span>
                    <Button
                      variant="outline"
                      disabled={page >= Math.ceil(total / 20)}
                      onClick={() => setPage(page + 1)}
                    >
                      Вперёд
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

