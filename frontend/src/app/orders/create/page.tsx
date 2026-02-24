'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { ordersApi } from '@/lib/api/orders';
import { SPECIALIZATION_LABELS } from '@/lib/utils';
import { CreateOrderData, Specialization, PaymentMethod } from '@/lib/types';
import { Paperclip, X, AlertCircle } from 'lucide-react';

export default function CreateOrderPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<CreateOrderData>>({
    budgetType: 'fixed',
    paymentMethod: 'CASH',
  });
  const [addressError, setAddressError] = useState<string>('');
  const [budgetError, setBudgetError] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.ymaps) {
      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY}&lang=ru_RU`;
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  const selectClassName = "w-full mt-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all duration-200";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.category) { setError('Выберите категорию'); return; }
    if (!formData.title || formData.title.length < 10) { setError('Заголовок должен содержать минимум 10 символов'); return; }
    if (!formData.description || formData.description.length < 20) { setError('Описание должно содержать минимум 20 символов'); return; }
    if (!formData.budget || formData.budget < 3000) { setError('Минимальная цена заказа — 3000₽'); return; }
    if (!formData.region || !formData.address) { setError('Укажите регион и адрес'); return; }

    if (!formData.latitude || !formData.longitude) {
      setError('Адрес должен быть выбран из выпадающего списка!');
      setAddressError('Выберите адрес из списка');
      return;
    }

    try {
      setIsLoading(true);
      const result = await ordersApi.createOrder(formData as CreateOrderData);
      if (files.length > 0 && result.order?.id) {
        try { await ordersApi.uploadFiles(result.order.id, files); } catch (fileErr) { console.error('File upload error:', fileErr); }
      }
      router.push('/customer/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка создания заказа');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== 'CUSTOMER') return null;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header showBack backHref="/customer/dashboard" />

      <main className="container mx-auto px-4 py-8 max-w-3xl page-enter">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl font-extrabold">Создать заказ</CardTitle>
            <CardDescription>Заполните информацию о работе</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="category">Категория работ *</Label>
                <select
                  id="category"
                  required
                  className={selectClassName}
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Specialization })}
                >
                  <option value="">Выберите категорию</option>
                  {Object.entries(SPECIALIZATION_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="title">Краткое описание (заголовок) *</Label>
                <Input id="title" required minLength={10} maxLength={200} placeholder="Например: Монтаж двух ПВХ-окон в панельной квартире" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                <p className="text-xs text-muted-foreground mt-1">Минимум 10 символов</p>
              </div>

              <div>
                <Label htmlFor="description">Подробное описание *</Label>
                <textarea
                  id="description"
                  required
                  minLength={20}
                  rows={6}
                  className="w-full mt-1.5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all duration-200 resize-y"
                  placeholder="Опишите подробно: объем работы, требования, материалы, особые условия..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">Минимум 20 символов</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="region">Город *</Label>
                  <select
                    id="region"
                    required
                    className={selectClassName}
                    value={formData.region || ''}
                    onChange={(e) => { setFormData({ ...formData, region: e.target.value }); setAddressError(''); }}
                  >
                    <option value="">Выберите город</option>
                    <option value="Москва и обл.">Москва и обл.</option>
                    <option value="Санкт-Петербург и обл.">Санкт-Петербург и обл.</option>
                    <option value="Краснодар">Краснодар</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="address">Адрес объекта *</Label>
                  <AddressAutocomplete
                    region={formData.region || ''}
                    value={formData.address || ''}
                    onChange={(value, coords) => {
                      if (coords) {
                        setFormData({ ...formData, address: value, latitude: coords.latitude, longitude: coords.longitude });
                        setAddressError('');
                      } else {
                        setFormData({ ...formData, address: value, latitude: undefined, longitude: undefined });
                      }
                    }}
                    placeholder="Начните вводить адрес..."
                    required
                    error={addressError}
                  />
                  <p className="text-xs text-amber-600 mt-1 font-medium">Выберите адрес из выпадающего списка</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Дата начала работ *</Label>
                  <Input
                    id="startDate" type="date" required
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Дата окончания</Label>
                  <Input
                    id="endDate" type="date"
                    min={formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                    value={formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value || undefined })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Бюджет *</Label>
                  <Input
                    id="budget" type="number" required min={3000} placeholder="3000"
                    value={formData.budget || ''}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setFormData({ ...formData, budget: value });
                      setBudgetError(value > 0 && value < 3000 ? 'Цена не может быть ниже 3000₽' : '');
                    }}
                    className={budgetError ? 'border-red-400 focus:ring-red-500/20' : ''}
                  />
                  {budgetError ? (
                    <p className="text-xs text-red-600 mt-1 font-medium">{budgetError}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">Минимум 3000₽</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="budgetType">Тип бюджета</Label>
                  <select id="budgetType" className={selectClassName} value={formData.budgetType || 'fixed'} onChange={(e) => setFormData({ ...formData, budgetType: e.target.value })}>
                    <option value="fixed">Фиксированная цена</option>
                    <option value="negotiable">Договорная</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="paymentMethod">Способ оплаты *</Label>
                <select id="paymentMethod" required className={selectClassName} value={formData.paymentMethod || 'CASH'} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}>
                  <option value="CASH">Наличные</option>
                  <option value="CARD">Перевод на карту</option>
                  <option value="BANK">Безналичный расчёт</option>
                </select>
              </div>

              {/* Files */}
              <div>
                <Label>Прикрепить файлы</Label>
                <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.dwg,.dxf" onChange={(e) => { if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]); }} className="hidden" />
                <div className="mt-2 space-y-2">
                  {files.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {files.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 text-sm">
                          <span className="truncate max-w-[180px]">{file.name}</span>
                          <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(1)} МБ)</span>
                          <button type="button" onClick={() => setFiles(files.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500 ml-1 transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
                    <Paperclip className="h-4 w-4" /> Добавить файл
                  </Button>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={isLoading} size="lg">
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Создание...
                    </div>
                  ) : 'Создать заказ'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()} size="lg">
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
