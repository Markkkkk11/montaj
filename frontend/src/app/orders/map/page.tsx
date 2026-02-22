'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { OrderMap } from '@/components/orders/OrderMap';
import { OrderFilters } from '@/components/orders/OrderFilters';
import { ordersApi } from '@/lib/api/orders';
import { Order, OrderFilters as Filters } from '@/lib/types';
import { Map, List } from 'lucide-react';

export default function OrdersMapPage() {
  const { user, logout, isHydrated } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({});
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) {
      router.push('/login');
      return;
    }
    loadOrders();
  }, [user, filters, isHydrated]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const result = await ordersApi.getOrders({ ...filters, limit: 100 });
      setOrders(result.orders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = (newFilters: Filters) => {
    setFilters(newFilters);
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
          <div className="flex items-center gap-3 cursor-pointer" onClick={goBack}>
            <img src="/logo.jpg" alt="Монтаж" className="h-12 w-12 rounded-lg object-cover shadow-sm" />
            <span className="text-xl font-bold text-primary hidden sm:inline">Монтаж</span>
          </div>
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
            <h2 className="text-3xl font-bold mb-2">Карта заказов</h2>
            <p className="text-muted-foreground">
              Найдено заказов: {orders.length}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              onClick={() => setViewMode('map')}
            >
              <Map className="h-4 w-4 mr-2" />
              Карта
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => router.push('/orders')}
            >
              <List className="h-4 w-4 mr-2" />
              Список
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <OrderFilters onApply={handleApplyFilters} initialFilters={filters} />
          </div>

          {/* Map */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Загрузка заказов...</p>
              </div>
            ) : (
              <OrderMap
                orders={orders}
                onOrderSelect={(orderId) => router.push(`/orders/${orderId}`)}
              />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold mb-2">ℹ️ Информация</h3>
          <p className="text-sm text-muted-foreground">
            На карте отображаются заказы с указанными координатами. Для полной интеграции с
            Яндекс.Картами необходимо получить API-ключ на{' '}
            <a
              href="https://developer.tech.yandex.ru/services/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              developer.tech.yandex.ru
            </a>{' '}
            и добавить его в конфигурацию приложения.
          </p>
        </div>
      </main>
    </div>
  );
}

