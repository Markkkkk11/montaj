'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { ordersApi } from '@/lib/api/orders';
import { responsesApi } from '@/lib/api/responses';
import { reviewsApi } from '@/lib/api/reviews';
import { Order, Response } from '@/lib/types';
import { SPECIALIZATION_LABELS } from '@/lib/utils';
import { Calendar, MapPin, Wallet, User, Phone, Mail, MessageCircle, CheckCircle, Star, ChevronRight, Paperclip, Play, XCircle, ArrowLeft } from 'lucide-react';
import { ChatBox } from '@/components/chat/ChatBox';
import { useToast } from '@/hooks/use-toast';

export default function OrderDetailPage() {
  const { user, isHydrated } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);
  const [responseCancelled, setResponseCancelled] = useState(false);
  const [canReview, setCanReview] = useState(false);

  const backHref = user?.role === 'ADMIN' ? '/admin/orders' : '/orders';

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) {
      router.push('/login');
      return;
    }
    loadOrderDetails();
  }, [user, orderId, isHydrated]);

  const loadOrderDetails = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      
      const [orderData] = await Promise.all([
        ordersApi.getOrderById(orderId),
        user?.role === 'EXECUTOR' 
          ? ordersApi.recordView(orderId).catch(() => {}) 
          : Promise.resolve(),
      ]);
      
      setOrder(orderData);

      if (user?.role === 'EXECUTOR' && orderData.responses) {
        const myResponse = orderData.responses.find(
          (response: Response) => response.executorId === user.id
        );
        setHasResponded(!!myResponse);
        setResponseCancelled(myResponse?.status === 'CANCELLED');
      }

      const promises: Promise<any>[] = [];
      
      if (user?.role === 'CUSTOMER' && orderData.customerId === user.id) {
        promises.push(
          responsesApi.getOrderResponses(orderId).then(data => setResponses(data))
        );
      }

      if (orderData.status === 'COMPLETED' && 
          (orderData.customerId === user?.id || orderData.executorId === user?.id)) {
        promises.push(
          reviewsApi.canLeaveReview(orderId)
            .then(data => setCanReview(data.canLeave))
            .catch(() => setCanReview(false))
        );
      }
      
      await Promise.all(promises);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки заказа');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleRespond = async () => {
    try {
      setActionLoading(true);
      setError(null);
      await responsesApi.createResponse(orderId);
      toast({ variant: 'success', title: '✅ Отклик отправлен!', description: 'Заказчик получит уведомление.' });
      setHasResponded(true);
      loadOrderDetails(true);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Ошибка отправки отклика';
      setError(msg);
      toast({ variant: 'destructive', title: '❌ Ошибка', description: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectExecutor = async (executorId: string) => {
    if (!confirm('Вы уверены, что хотите выбрать этого исполнителя?')) return;
    try {
      setActionLoading(true);
      await ordersApi.selectExecutor(orderId, executorId);
      toast({ variant: 'success', title: '✅ Исполнитель выбран!', description: 'Исполнитель получит уведомление.' });
      loadOrderDetails(true);
    } catch (err: any) {
      toast({ variant: 'destructive', title: '❌ Ошибка', description: err.response?.data?.error || 'Ошибка выбора' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteOrder = async () => {
    const msg = user?.role === 'CUSTOMER'
      ? 'Подтвердите, что работа выполнена и вы довольны результатом'
      : 'Подтвердите, что работа выполнена и оплата получена';
    if (!confirm(msg)) return;
    try {
      setActionLoading(true);
      await ordersApi.completeOrder(orderId);
      toast({ variant: 'success', title: '✅ Заказ завершён!' });
      loadOrderDetails(true);
    } catch (err: any) {
      toast({ variant: 'destructive', title: '❌ Ошибка', description: err.response?.data?.error || 'Ошибка' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm('Вы уверены? Средства будут возвращены исполнителям.')) return;
    try {
      setActionLoading(true);
      await ordersApi.cancelOrder(orderId);
      toast({ variant: 'success', title: 'Заказ отменён' });
      router.push('/customer/dashboard');
    } catch (err: any) {
      toast({ variant: 'destructive', title: '❌ Ошибка', description: err.response?.data?.error || 'Ошибка' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartWork = async () => {
    if (!confirm('Подтвердите, что приступаете к работе')) return;
    try {
      setActionLoading(true);
      await ordersApi.startWork(orderId);
      toast({ variant: 'success', title: '🔧 Вы приступили к работе!' });
      loadOrderDetails(true);
    } catch (err: any) {
      toast({ variant: 'destructive', title: '❌ Ошибка', description: err.response?.data?.error || 'Ошибка' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelWork = async () => {
    const reason = prompt('Укажите причину отказа (необязательно):');
    if (reason === null) return;
    try {
      setActionLoading(true);
      await ordersApi.cancelWork(orderId, reason || undefined);
      toast({ variant: 'success', title: 'Вы отказались от заказа' });
      loadOrderDetails(true);
    } catch (err: any) {
      toast({ variant: 'destructive', title: '❌ Ошибка', description: err.response?.data?.error || 'Ошибка' });
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <Header showBack backHref={backHref} />
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="space-y-4">
            <div className="h-8 w-48 skeleton rounded-xl" />
            <div className="h-64 skeleton rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <Header showBack backHref={backHref} />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-10 w-10 text-red-400" />
            </div>
            <p className="text-red-600 font-semibold mb-4">{error || 'Заказ не найден'}</p>
            <Button onClick={() => router.back()} variant="outline">Вернуться назад</Button>
          </div>
        </div>
      </div>
    );
  }

  const isCustomer = user.role === 'CUSTOMER' && order.customerId === user.id;
  const isExecutor = user.role === 'EXECUTOR';
  const isAssignedExecutor = order.executorId === user.id;
  const canRespond = isExecutor && order.status === 'PUBLISHED' && !isAssignedExecutor;
  const budget = order.budgetType === 'negotiable' ? 'Договорная' : `${Math.round(Number(order.budget)).toLocaleString('ru-RU')} ₽`;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header showBack backHref={backHref} />

      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-5xl page-enter">
        {/* Order Details Card */}
        <Card className="mb-6 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="badge-primary">
                    {SPECIALIZATION_LABELS[order.category]}
                  </span>
                  <span className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                    order.status === 'PUBLISHED' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                    order.status === 'IN_PROGRESS' && !order.workStartedAt ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                    order.status === 'IN_PROGRESS' && order.workStartedAt ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                    order.status === 'COMPLETED' ? 'bg-gray-50 text-gray-600 border border-gray-100' :
                    'bg-red-50 text-red-700 border border-red-100'
                  }`}>
                    {order.status === 'PUBLISHED' && 'Опубликован'}
                    {order.status === 'IN_PROGRESS' && !order.workStartedAt && 'Исполнитель выбран'}
                    {order.status === 'IN_PROGRESS' && order.workStartedAt && 'В работе'}
                    {order.status === 'COMPLETED' && 'Завершён'}
                    {order.status === 'CANCELLED' && 'Отменён'}
                  </span>
                </div>
                <CardTitle className="text-xl sm:text-2xl font-extrabold">
                  {order.orderNumber ? <span className="text-muted-foreground font-bold">#{order.orderNumber}</span> : null}
                  {order.orderNumber ? ' — ' : ''}{order.title}
                </CardTitle>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="p-4 bg-gray-50 rounded-xl">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Описание</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{order.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Местоположение</p>
                  <p className="text-sm font-semibold text-gray-900">{order.region}, {order.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Сроки</p>
                  <p className="text-sm font-semibold text-gray-900">
                    Начало: {new Date(order.startDate).toLocaleDateString('ru-RU')}
                    {order.endDate && <span className="text-muted-foreground"> — {new Date(order.endDate).toLocaleDateString('ru-RU')}</span>}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Wallet className="h-4 w-4 text-blue-700" />
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-600">Бюджет</p>
                  <p className="text-lg font-extrabold text-blue-700">{budget}</p>
                  <p className="text-xs text-blue-500">
                    {order.paymentMethod === 'CASH' && 'Наличные'}
                    {order.paymentMethod === 'CARD' && 'На карту'}
                    {order.paymentMethod === 'BANK' && 'Безналичный'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Заказчик</p>
                  <p className="text-sm font-semibold text-gray-900">{order.customer?.fullName || 'Неизвестно'}</p>
                  {order.customer?.organization && (
                    <p className="text-xs text-muted-foreground">{order.customer.organization}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Files */}
            {order.files && order.files.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Paperclip className="h-4 w-4" /> Приложенные файлы
                </h3>
                <div className="flex flex-wrap gap-2">
                  {order.files.map((file, idx) => {
                    const filename = file.split('/').pop() || file;
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
                    const fileUrl = file.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${file}` : file;
                    return (
                      <a
                        key={idx}
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 rounded-xl px-3 py-2 text-sm transition-all duration-200 border border-gray-100 hover:border-gray-200"
                      >
                        {isImage ? '🖼️' : '📄'} {filename}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Contact sections */}
            {isAssignedExecutor && order.customer && (
              <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                <h3 className="font-bold text-blue-900 mb-3">Контакты заказчика</h3>
                <div className="space-y-2">
                  {order.customer.phone && (
                    <a href={`tel:${order.customer.phone}`} className="flex items-center gap-2 text-sm text-blue-700 hover:underline">
                      <Phone className="h-4 w-4" /> {order.customer.phone}
                    </a>
                  )}
                  {order.customer.email && (
                    <a href={`mailto:${order.customer.email}`} className="flex items-center gap-2 text-sm text-blue-700 hover:underline">
                      <Mail className="h-4 w-4" /> {order.customer.email}
                    </a>
                  )}
                </div>
              </div>
            )}

            {isCustomer && order.executor && order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
              <div className="p-5 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-100">
                <h3 className="font-bold text-emerald-900 mb-3">Контакты исполнителя</h3>
                <p className="text-sm mb-2">
                  <strong>{order.executor.fullName}</strong>
                  <span className="ml-2 text-muted-foreground">⭐ {order.executor.rating.toFixed(1)} ({order.executor.completedOrders} заказов)</span>
                </p>
                <div className="space-y-2">
                  {order.executor.phone && (
                    <a href={`tel:${order.executor.phone}`} className="flex items-center gap-2 text-sm text-emerald-700 hover:underline">
                      <Phone className="h-4 w-4" /> {order.executor.phone}
                    </a>
                  )}
                  {order.executor.email && (
                    <a href={`mailto:${order.executor.email}`} className="flex items-center gap-2 text-sm text-emerald-700 hover:underline">
                      <Mail className="h-4 w-4" /> {order.executor.email}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Status banners */}
            {isAssignedExecutor && order.status === 'IN_PROGRESS' && !order.workStartedAt && (
              <div className="p-5 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border border-amber-200 flex items-start gap-4">
                <span className="text-3xl">🎉</span>
                <div>
                  <p className="font-bold text-amber-900">Заказчик выбрал вас!</p>
                  <p className="text-sm text-amber-700 mt-1">Вы можете приступить к выполнению или отказаться.</p>
                </div>
              </div>
            )}

            {isAssignedExecutor && order.status === 'IN_PROGRESS' && order.workStartedAt && (
              <div className="p-5 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-200 flex items-start gap-4">
                <span className="text-3xl">🔧</span>
                <div>
                  <p className="font-bold text-emerald-900">Вы выполняете этот заказ</p>
                  <p className="text-sm text-emerald-700 mt-1">
                    Работа начата {new Date(order.workStartedAt).toLocaleDateString('ru-RU')}.
                  </p>
                </div>
              </div>
            )}

            {isCustomer && order.status === 'IN_PROGRESS' && !order.workStartedAt && order.executor && (
              <div className="p-5 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border border-amber-200 flex items-start gap-4">
                <span className="text-3xl">⏳</span>
                <div>
                  <p className="font-bold text-amber-900">Ожидание начала работы</p>
                  <p className="text-sm text-amber-700 mt-1">Исполнитель {order.executor.fullName} ещё не приступил.</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
              {canRespond && !hasResponded && (
                <Button onClick={handleRespond} disabled={actionLoading} className="flex-1 w-full sm:w-auto" size="lg">
                  {actionLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Отправка...
                    </div>
                  ) : 'Откликнуться на заказ'}
                </Button>
              )}
              
              {hasResponded && !isAssignedExecutor && !responseCancelled && (
                <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-emerald-900">Отклик отправлен!</p>
                    <p className="text-sm text-emerald-700">Заказчик рассмотрит ваш отклик</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => router.push('/executor/dashboard')} className="border-emerald-200 hover:bg-emerald-100 w-full sm:w-auto">
                    Мои отклики
                  </Button>
                </div>
              )}

              {responseCancelled && !isAssignedExecutor && (
                <div className="flex-1 bg-orange-50 border border-orange-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-orange-900">Вы отказались от этого заказа</p>
                    <p className="text-sm text-orange-700">Заказ снова доступен другим исполнителям</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => router.push('/executor/dashboard')} className="border-orange-200 hover:bg-orange-100 w-full sm:w-auto">
                    К заказам
                  </Button>
                </div>
              )}

              {isAssignedExecutor && order.status === 'IN_PROGRESS' && !order.workStartedAt && (
                <>
                  <Button onClick={handleStartWork} disabled={actionLoading} className="flex-1 w-full sm:w-auto gap-2" size="lg" variant="success">
                    <Play className="h-5 w-5" /> Приступить к работе
                  </Button>
                  <Button onClick={handleCancelWork} disabled={actionLoading} variant="destructive" size="lg">
                    Отказаться
                  </Button>
                </>
              )}

              {isAssignedExecutor && order.status === 'IN_PROGRESS' && order.workStartedAt && (
                <>
                  <Button onClick={handleCompleteOrder} disabled={actionLoading} className="flex-1 w-full sm:w-auto gap-2" size="lg" variant="success">
                    <CheckCircle className="h-5 w-5" /> Заказ выполнен
                  </Button>
                  <Button onClick={handleCancelWork} disabled={actionLoading} variant="outline">
                    Отказаться
                  </Button>
                </>
              )}

              {isCustomer && order.status === 'IN_PROGRESS' && order.workStartedAt && (
                <Button onClick={handleCompleteOrder} disabled={actionLoading} className="flex-1 w-full sm:w-auto gap-2" size="lg" variant="success">
                  <CheckCircle className="h-5 w-5" /> Подтвердить выполнение
                </Button>
              )}

              {isCustomer && order.status === 'PUBLISHED' && (
                <Button onClick={handleCancelOrder} disabled={actionLoading} variant="destructive" size="sm">
                  Отменить заказ
                </Button>
              )}

              {order.status === 'COMPLETED' && (isCustomer || isAssignedExecutor) && canReview && (
                <Button onClick={() => router.push(`/orders/${orderId}/review`)} variant="outline" className="flex-1 w-full sm:w-auto gap-2">
                  <Star className="h-4 w-4" /> Оставить отзыв
                </Button>
              )}
              {order.status === 'COMPLETED' && (isCustomer || isAssignedExecutor) && !canReview && (
                <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                  <p className="text-sm text-emerald-700 font-medium">✅ Отзыв оставлен</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Responses Section */}
        {isCustomer && responses.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Отклики ({responses.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {responses.map((response) => (
                  <div key={response.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-soft transition-all duration-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        {response.executor?.photo ? (
                          <img
                            src={response.executor.photo.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${response.executor.photo}` : response.executor.photo}
                            alt=""
                            className="w-11 h-11 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{response.executor?.fullName?.[0]}</span>
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-gray-900">{response.executor?.fullName}</h4>
                          <p className="text-xs text-muted-foreground">
                            ⭐ {response.executor?.rating.toFixed(1)} • {response.executor?.completedOrders} заказов
                          </p>
                        </div>
                      </div>
                    </div>

                    {response.executor?.executorProfile?.shortDescription && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{response.executor.executorProfile.shortDescription}</p>
                    )}

                    {response.executor?.executorProfile?.specializations && response.executor.executorProfile.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {response.executor.executorProfile.specializations.map((spec: string) => (
                          <span key={spec} className="badge-primary">{SPECIALIZATION_LABELS[spec] || spec}</span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 items-center flex-wrap mt-2">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/profile/${response.executorId}`)} className="text-xs sm:text-sm">
                        Профиль
                      </Button>
                      {order.status === 'PUBLISHED' && response.status === 'PENDING' && (
                        <Button onClick={() => handleSelectExecutor(response.executorId)} disabled={actionLoading} size="sm" className="text-xs sm:text-sm">
                          Выбрать
                        </Button>
                      )}
                      {response.status === 'ACCEPTED' && (
                        <span className="badge-success">✓ Выбран</span>
                      )}
                      {response.status === 'REJECTED' && (
                        <span className="badge-neutral">Отклонён</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {isCustomer && responses.length === 0 && order.status === 'PUBLISHED' && (
          <Card className="mb-6 border-dashed border-2">
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">Пока нет откликов на этот заказ</p>
            </CardContent>
          </Card>
        )}

        {/* Chat */}
        {order.status === 'IN_PROGRESS' && (isCustomer || isAssignedExecutor) && (
          <div className="mt-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              Чат с {isCustomer ? 'исполнителем' : 'заказчиком'}
            </h2>
            <ChatBox 
              orderId={orderId} 
              otherUserId={isCustomer ? order.executorId || undefined : order.customerId}
            />
          </div>
        )}

        {order.status === 'COMPLETED' && (isCustomer || isAssignedExecutor) && (
          <div className="mt-6">
            <Card className="p-6 text-center bg-gray-50/80 border-dashed border-2">
              <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-muted-foreground font-medium">Чат завершён</p>
              <p className="text-sm text-muted-foreground mt-1">Переписка по этому заказу закрыта.</p>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
