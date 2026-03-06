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
import { SPECIALIZATION_LABELS } from '@/lib/utils';
import { Search, Eye, Trash2, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const AVAILABLE_REGIONS = [
  'Москва и обл.',
  'Санкт-Петербург и обл.',
  'Краснодар',
];

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
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<string>('desc');

  useEffect(() => {
    loadOrders();
  }, [statusFilter, regionFilter, categoryFilter, sortBy, sortOrder]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params: any = {
        sortBy,
        sortOrder,
        limit: 10000,
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (regionFilter !== 'all') params.region = regionFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;

      const data = await adminApi.getOrders(params);
      setOrders(data.orders || data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    if (!confirm('Одобрить и опубликовать этот заказ?')) {
      return;
    }
    try {
      await adminApi.moderateOrder(orderId, 'APPROVE');
      loadOrders();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ошибка одобрения заказа');
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    const reason = prompt('Укажите причину отклонения (необязательно):');
    try {
      await adminApi.moderateOrder(orderId, 'REJECT', reason || undefined);
      loadOrders();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ошибка отклонения заказа');
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

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;
    const categoryLabel = (SPECIALIZATION_LABELS[order.category] || order.category).toLowerCase();
    return (
      order.title.toLowerCase().includes(query) ||
      order.customer.fullName.toLowerCase().includes(query) ||
      order.region.toLowerCase().includes(query) ||
      categoryLabel.includes(query) ||
      (order.orderNumber && order.orderNumber.toString().includes(query))
    );
  });

  const getStatusBadge = (status: string) => {
    const colors: any = {
      PENDING: 'bg-orange-100 text-orange-800',
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
      PENDING: 'На модерации',
      PUBLISHED: 'Опубликован',
      IN_PROGRESS: 'В работе',
      COMPLETED: 'Завершен',
      CANCELLED: 'Отменен',
      ARCHIVED: 'Архивирован',
    };
    return labels[status] || status;
  };

  const SortIcon = () => {
    if (sortOrder === 'desc') return <ArrowDown className="h-3 w-3" />;
    return <ArrowUp className="h-3 w-3" />;
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Поиск */}
            <div className="md:col-span-2 lg:col-span-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по названию, заказчику, региону, номеру..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Статус */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="PENDING">🟠 На модерации</SelectItem>
                <SelectItem value="PUBLISHED">🔵 Опубликованные</SelectItem>
                <SelectItem value="IN_PROGRESS">🟡 В работе</SelectItem>
                <SelectItem value="COMPLETED">🟢 Завершенные</SelectItem>
                <SelectItem value="CANCELLED">🔴 Отмененные</SelectItem>
                <SelectItem value="ARCHIVED">⚪ Архивированные</SelectItem>
              </SelectContent>
            </Select>

            {/* Регион */}
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Регион" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все регионы</SelectItem>
                {AVAILABLE_REGIONS.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Категория */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Категория" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {Object.entries(SPECIALIZATION_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Сортировка */}
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Сортировка" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">По дате создания</SelectItem>
                  <SelectItem value="updatedAt">По дате обновления</SelectItem>
                  <SelectItem value="budget">По бюджету</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleSortOrder}
                title={sortOrder === 'desc' ? 'Сначала новые' : 'Сначала старые'}
              >
                <SortIcon />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Заказы ({filteredOrders.length})
            {sortOrder === 'desc' ? (
              <span className="text-xs font-normal text-muted-foreground flex items-center gap-1">
                <ArrowDown className="h-3 w-3" /> новые сначала
              </span>
            ) : (
              <span className="text-xs font-normal text-muted-foreground flex items-center gap-1">
                <ArrowUp className="h-3 w-3" /> старые сначала
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Заказы не найдены
            </div>
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
                  <TableHead
                    className="cursor-pointer select-none hover:text-primary transition-colors"
                    onClick={() => {
                      if (sortBy === 'createdAt') {
                        toggleSortOrder();
                      } else {
                        setSortBy('createdAt');
                        setSortOrder('desc');
                      }
                    }}
                  >
                    <span className="flex items-center gap-1">
                      Дата создания
                      {sortBy === 'createdAt' ? <SortIcon /> : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                    </span>
                  </TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} className={order.status === 'PENDING' ? 'bg-orange-50/50' : ''}>
                    <TableCell className="font-mono text-sm font-bold text-primary">
                      {order.orderNumber ? `#${order.orderNumber}` : '—'}
                    </TableCell>
                    <TableCell className="font-medium">{order.title}</TableCell>
                    <TableCell>{SPECIALIZATION_LABELS[order.category] || order.category}</TableCell>
                    <TableCell>{order.region}</TableCell>
                    <TableCell>{Math.round(Number(order.budget)).toLocaleString('ru-RU')} ₽</TableCell>
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
                    <TableCell className="whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {order.status === 'PENDING' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApproveOrder(order.id)}
                              title="Одобрить"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRejectOrder(order.id)}
                              title="Отклонить"
                            >
                              <XCircle className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/orders/${order.id}`)}
                          title="Просмотр"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteOrder(order.id)}
                          title="Удалить"
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
