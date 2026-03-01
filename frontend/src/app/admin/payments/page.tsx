'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { adminApi } from '@/lib/api/admin';
import { DollarSign, Calendar, User, ArrowLeft, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Payment {
  id: string;
  amount: number | string;
  purpose: string;
  description: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    phone: string;
    role: string;
  };
}

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSum, setTotalSum] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadPayments();
  }, [page]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 30 };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await adminApi.getPaymentHistory(params);
      setPayments(data.payments || []);
      setTotalSum(data.totalSum || 0);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setPage(1);
    loadPayments();
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setPage(1);
    setTimeout(() => loadPayments(), 0);
  };

  const getRoleBadge = (role: string) => {
    if (role === 'EXECUTOR') return 'bg-blue-100 text-blue-800';
    if (role === 'CUSTOMER') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role: string) => {
    if (role === 'EXECUTOR') return 'Исполнитель';
    if (role === 'CUSTOMER') return 'Заказчик';
    return role;
  };

  const getPurposeLabel = (purpose: string) => {
    const labels: any = {
      top_up: 'Пополнение баланса',
      subscription: 'Оплата подписки',
    };
    return labels[purpose] || purpose;
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 sm:mb-8">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin')} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          К дашборду
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold">История пополнений</h1>
        <p className="text-muted-foreground mt-2">
          Все пополнения пользователей платформы
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Общая сумма</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{totalSum.toLocaleString('ru-RU')} ₽</div>
            <p className="text-xs text-muted-foreground mt-1">
              {total} {total === 1 ? 'платёж' : 'платежей'}
              {(startDate || endDate) && ' за выбранный период'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Date Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Дата от</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-44"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Дата до</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-44"
              />
            </div>
            <Button onClick={handleFilter} className="gap-2">
              <Filter className="h-4 w-4" />
              Показать
            </Button>
            {(startDate || endDate) && (
              <Button variant="outline" onClick={handleReset}>
                Сбросить
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Платежи ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Платежей не найдено</div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата</TableHead>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>Роль</TableHead>
                      <TableHead>Назначение</TableHead>
                      <TableHead>Описание</TableHead>
                      <TableHead className="text-right">Сумма</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(payment.createdAt).toLocaleDateString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                          <div className="text-xs">
                            {new Date(payment.createdAt).toLocaleTimeString('ru-RU', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{payment.user.fullName}</div>
                          <div className="text-xs text-muted-foreground">{payment.user.phone}</div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(payment.user.role)}`}>
                            {getRoleLabel(payment.user.role)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{getPurposeLabel(payment.purpose)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {payment.description}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-green-700">
                            +{parseFloat(payment.amount.toString()).toLocaleString('ru-RU')} ₽
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    ←
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    →
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

