'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { OrderMap } from '@/components/orders/OrderMap';
import { OrderFilters } from '@/components/orders/OrderFilters';
import { Header } from '@/components/layout/Header';
import { ordersApi } from '@/lib/api/orders';
import { Order, OrderFilters as Filters } from '@/lib/types';
import { Map, List, Info } from 'lucide-react';

export default function OrdersMapPage() {
  const { user, isHydrated } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({ region: 'Москва и обл.' });
  const requestIdRef = useRef(0);

  const loadOrders = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    try {
      setIsLoading(true);
      const result = await ordersApi.getOrders({ ...filters, limit: 100 });
      if (currentRequestId !== requestIdRef.current) return;
      setOrders(result.orders);
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) return;
      console.error('Error loading orders:', error);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [filters]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) { router.push('/login'); return; }
    loadOrders();
  }, [user, filters, isHydrated, loadOrders]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header showBack />

      <main className="container mx-auto px-4 py-8 page-enter">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-1">Карта заказов</h1>
            <p className="text-muted-foreground">Найдено: <strong>{orders.length}</strong></p>
          </div>
          <div className="flex bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
            <Button variant="default" size="sm" className="gap-2 rounded-lg">
              <Map className="w-4 h-4" /> Карта
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push('/orders')} className="gap-2 rounded-lg">
              <List className="w-4 h-4" /> Список
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <OrderFilters onApply={(f) => setFilters(f)} initialFilters={filters} />
          </div>
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="h-96 skeleton rounded-2xl" />
            ) : (
              <OrderMap orders={orders} onOrderSelect={(orderId) => router.push(`/orders/${orderId}`)} />
            )}
          </div>
        </div>

        <div className="mt-8 p-5 bg-blue-50/80 border border-blue-100 rounded-2xl flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-blue-900 text-sm mb-1">Информация</h3>
            <p className="text-sm text-blue-700">
              На карте отображаются заказы с указанными координатами.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
