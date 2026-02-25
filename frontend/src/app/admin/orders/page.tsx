'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { adminApi } from '@/lib/api/admin';
import { Search, Eye, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Order {
  id: string;
  orderNumber?: number;
  title: string;
  category: string;
  region: string;
  budget: number;
  status: string;
  createdAt: string;
  customer: {
    fullName: string;
    phone: string;
  };
  executor?: {
    fullName: string;
    phone: string;
  };
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;

      const data = await adminApi.getOrders(params);
      setOrders(data.orders || data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот заказ?')) {
      return;
    }
    try {
      await adminApi.deleteOrder(orderId);
      loadOrders();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ошибка удаления заказа');
    }
  };

  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase();
    return (
      order.title.toLowerCase().includes(query) ||
      order.customer.fullName.toLowerCase().includes(query) ||
      order.region.toLowerCase().includes(query) ||
      (order.orderNumber && order.orderNumber.toString().includes(query))
    );
  });

  const getStatusBadge = (status: string) => {
    const colors: any = {
      PUBLISHED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      ARCHIVED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: any = {
      PUBLISHED: 'Опубликован',
      IN_PROGRESS: 'В работе',
      COMPLETED: 'Завершен',
      CANCELLED: 'Отменен',
      ARCHIVED: 'Архивирован',
    };
    return labels[status] || status;
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Управление заказами</h1>
        <p className="text-muted-foreground mt-2">
          Просмотр и управление всеми заказами на платформе
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по названию, заказчику, региону..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="PUBLISHED">Опубликованные</SelectItem>
                <SelectItem value="IN_PROGRESS">В работе</SelectItem>
                <SelectItem value="COMPLETED">Завершенные</SelectItem>
                <SelectItem value="CANCELLED">Отмененные</SelectItem>
                <SelectItem value="ARCHIVED">Архивированные</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Заказы ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : (
            <div className="overflow-x-auto -mx-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>№</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Регион</TableHead>
                  <TableHead>Бюджет</TableHead>
                  <TableHead>Заказчик</TableHead>
                  <TableHead>Исполнитель</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата создания</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm font-bold text-primary">
                      {order.orderNumber ? `#${order.orderNumber}` : '—'}
                    </TableCell>
                    <TableCell className="font-medium">{order.title}</TableCell>
                    <TableCell>{order.category}</TableCell>
                    <TableCell>{order.region}</TableCell>
                    <TableCell>{parseFloat(order.budget.toString()).toFixed(2)} ₽</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{order.customer.fullName}</div>
                        <div className="text-muted-foreground">{order.customer.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.executor ? (
                        <div className="text-sm">
                          <div>{order.executor.fullName}</div>
                          <div className="text-muted-foreground">{order.executor.phone}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                          order.status
                        )}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/orders/${order.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteOrder(order.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

