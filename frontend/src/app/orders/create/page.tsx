'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ordersApi } from '@/lib/api/orders';
import { SPECIALIZATION_LABELS } from '@/lib/utils';
import { CreateOrderData, Specialization, PaymentMethod } from '@/lib/types';

export default function CreateOrderPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<CreateOrderData>>({
    budgetType: 'fixed',
    paymentMethod: 'CASH',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Валидация
    if (!formData.category) {
      setError('Выберите категорию');
      return;
    }

    if (!formData.title || formData.title.length < 10) {
      setError('Заголовок должен содержать минимум 10 символов');
      return;
    }

    if (!formData.description || formData.description.length < 20) {
      setError('Описание должно содержать минимум 20 символов');
      return;
    }

    if (!formData.budget || formData.budget < 5000) {
      setError('Минимальная цена заказа - 5000₽');
      return;
    }

    try {
      setIsLoading(true);
      await ordersApi.createOrder(formData as CreateOrderData);
      router.push('/customer/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка создания заказа');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== 'CUSTOMER') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          ← Назад
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Создать заказ</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="category">Категория работ *</Label>
                <select
                  id="category"
                  required
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.category || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as Specialization })
                  }
                >
                  <option value="">Выберите категорию</option>
                  {Object.entries(SPECIALIZATION_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="title">Краткое описание (заголовок) *</Label>
                <Input
                  id="title"
                  required
                  minLength={10}
                  maxLength={200}
                  placeholder="Например: Монтаж двух ПВХ-окон в панельной квартире"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Минимум 10 символов
                </p>
              </div>

              <div>
                <Label htmlFor="description">Подробное описание *</Label>
                <textarea
                  id="description"
                  required
                  minLength={20}
                  rows={6}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Опишите подробно: объем работы, требования, материалы, особые условия..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Минимум 20 символов. Чем подробнее, тем лучше!
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="region">Регион *</Label>
                  <Input
                    id="region"
                    required
                    placeholder="Москва"
                    value={formData.region || ''}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="address">Адрес объекта *</Label>
                  <Input
                    id="address"
                    required
                    placeholder="ул. Примерная, д. 1"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Дата начала работ *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={
                      formData.startDate
                        ? new Date(formData.startDate).toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">Дата окончания (необязательно)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    min={
                      formData.startDate
                        ? new Date(formData.startDate).toISOString().split('T')[0]
                        : new Date().toISOString().split('T')[0]
                    }
                    value={
                      formData.endDate
                        ? new Date(formData.endDate).toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value || undefined })
                    }
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Бюджет *</Label>
                  <Input
                    id="budget"
                    type="number"
                    required
                    min={5000}
                    placeholder="5000"
                    value={formData.budget || ''}
                    onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Минимум 5000₽
                  </p>
                </div>

                <div>
                  <Label htmlFor="budgetType">Тип бюджета</Label>
                  <select
                    id="budgetType"
                    className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.budgetType || 'fixed'}
                    onChange={(e) => setFormData({ ...formData, budgetType: e.target.value })}
                  >
                    <option value="fixed">Фиксированная цена</option>
                    <option value="negotiable">Договорная</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="paymentMethod">Способ оплаты *</Label>
                <select
                  id="paymentMethod"
                  required
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.paymentMethod || 'CASH'}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })
                  }
                >
                  <option value="CASH">Наличные</option>
                  <option value="CARD">Перевод на карту</option>
                  <option value="BANK">Безналичный расчёт</option>
                </select>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? 'Создание...' : 'Создать заказ'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

