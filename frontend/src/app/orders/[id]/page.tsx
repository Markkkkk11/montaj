'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ordersApi } from '@/lib/api/orders';
import { responsesApi } from '@/lib/api/responses';
import { Order, Response } from '@/lib/types';
import { SPECIALIZATION_LABELS } from '@/lib/utils';
import { Calendar, MapPin, Wallet, User, Phone, Mail, MessageCircle, CheckCircle } from 'lucide-react';
import { ChatBox } from '@/components/chat/ChatBox';
import { useToast } from '@/hooks/use-toast';

export default function OrderDetailPage() {
  const { user } = useAuthStore();
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

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadOrderDetails();
  }, [user, orderId]);

  const loadOrderDetails = async () => {
    try {
      setIsLoading(true);
      const orderData = await ordersApi.getOrderById(orderId);
      setOrder(orderData);

      // Проверить, откликался ли уже текущий исполнитель
      if (user?.role === 'EXECUTOR' && orderData.responses) {
        const hasResponse = orderData.responses.some(
          (response: Response) => response.executorId === user.id
        );
        setHasResponded(hasResponse);
      }

      // Записать просмотр, если это исполнитель
      if (user?.role === 'EXECUTOR') {
        try {
          await ordersApi.recordView(orderId);
        } catch (err) {
          // Игнорируем ошибки записи просмотра (не критично)
          console.error('Ошибка записи просмотра:', err);
        }
      }

      // Загрузить отклики (если это заказчик или сам исполнитель)
      if (user?.role === 'CUSTOMER' && orderData.customerId === user.id) {
        const responsesData = await responsesApi.getOrderResponses(orderId);
        setResponses(responsesData);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки заказа');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async () => {
    try {
      setActionLoading(true);
      setError(null);
      await responsesApi.createResponse(orderId);
      
      // Показать успешное уведомление
      toast({
        variant: 'success',
        title: '✅ Отклик отправлен!',
        description: 'Заказчик получит уведомление о вашем отклике. Вы можете отслеживать статус в разделе "Мои отклики".',
      });
      
      // Установить флаг, что откликнулись
      setHasResponded(true);
      
      // Обновить данные заказа
      setTimeout(() => {
        loadOrderDetails();
      }, 500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Ошибка отправки отклика';
      setError(errorMessage);
      
      toast({
        variant: 'destructive',
        title: '❌ Ошибка',
        description: errorMessage,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectExecutor = async (executorId: string) => {
    if (!confirm('Вы уверены, что хотите выбрать этого исполнителя?')) {
      return;
    }

    try {
      setActionLoading(true);
      await ordersApi.selectExecutor(orderId, executorId);
      
      toast({
        variant: 'success',
        title: '✅ Исполнитель выбран!',
        description: 'Контакты теперь доступны обеим сторонам.',
      });
      
      loadOrderDetails();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: '❌ Ошибка',
        description: err.response?.data?.error || 'Ошибка выбора исполнителя',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (!confirm('Подтвердите, что работа выполнена и оплата получена')) {
      return;
    }

    try {
      setActionLoading(true);
      await ordersApi.completeOrder(orderId);
      alert('Заказ завершён! Теперь заказчик может оставить отзыв.');
      loadOrderDetails();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка завершения заказа');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm('Вы уверены, что хотите отменить заказ? Средства будут возвращены исполнителям.')) {
      return;
    }

    try {
      setActionLoading(true);
      await ordersApi.cancelOrder(orderId);
      alert('Заказ отменён');
      router.push('/customer/dashboard');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка отмены заказа');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartWork = async () => {
    if (!confirm('Подтвердите, что вы приступаете к выполнению заказа')) {
      return;
    }

    try {
      setActionLoading(true);
      await ordersApi.startWork(orderId);
      alert('Вы приступили к работе! Заказчик получил уведомление.');
      loadOrderDetails();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка начала работы');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelWork = async () => {
    const reason = prompt('Укажите причину отказа от заказа (необязательно):');
    if (reason === null) {
      return; // Пользователь отменил
    }

    try {
      setActionLoading(true);
      await ordersApi.cancelWork(orderId, reason || undefined);
      alert('Вы отказались от заказа. Он снова доступен для откликов.');
      loadOrderDetails();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка отказа от заказа');
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Заказ не найден'}</p>
          <Button onClick={() => router.back()}>Вернуться назад</Button>
        </div>
      </div>
    );
  }

  const isCustomer = user.role === 'CUSTOMER' && order.customerId === user.id;
  const isExecutor = user.role === 'EXECUTOR';
  const isAssignedExecutor = order.executorId === user.id;
  const canRespond = isExecutor && order.status === 'PUBLISHED' && !isAssignedExecutor;
  const budget =
    order.budgetType === 'negotiable'
      ? 'Договорная'
      : `${parseFloat(order.budget).toLocaleString()} ₽`;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          ← Назад
        </Button>

        {/* Order Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {SPECIALIZATION_LABELS[order.category]}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {order.status === 'PUBLISHED' && 'Опубликован'}
                    {order.status === 'IN_PROGRESS' && 'В работе'}
                    {order.status === 'COMPLETED' && 'Завершён'}
                    {order.status === 'CANCELLED' && 'Отменён'}
                  </span>
                </div>
                <CardTitle className="text-2xl mb-2">{order.title}</CardTitle>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Описание</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{order.description}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Местоположение</p>
                  <p className="text-sm text-muted-foreground">
                    {order.region}, {order.address}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Сроки</p>
                  <p className="text-sm text-muted-foreground">
                    Начало: {new Date(order.startDate).toLocaleDateString('ru-RU')}
                    {order.endDate && (
                      <>
                        <br />
                        Окончание: {new Date(order.endDate).toLocaleDateString('ru-RU')}
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Wallet className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Бюджет</p>
                  <p className="text-lg text-primary font-semibold">{budget}</p>
                  <p className="text-xs text-muted-foreground">
                    Оплата: {order.paymentMethod === 'CASH' && 'Наличные'}
                    {order.paymentMethod === 'CARD' && 'На карту'}
                    {order.paymentMethod === 'BANK' && 'Безналичный'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Заказчик</p>
                  <p className="text-sm text-muted-foreground">
                    {order.customer?.fullName || 'Неизвестно'}
                  </p>
                  {order.customer?.organization && (
                    <p className="text-xs text-muted-foreground">{order.customer.organization}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Контакты заказчика (видны только выбранному исполнителю) */}
            {isAssignedExecutor && order.customer && (
              <div className="pt-4 border-t bg-blue-50 -mx-6 px-6 py-4">
                <h3 className="font-semibold mb-3">Контакты заказчика</h3>
                <div className="space-y-2 text-sm">
                  {order.customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${order.customer.phone}`} className="text-primary hover:underline">
                        {order.customer.phone}
                      </a>
                    </div>
                  )}
                  {order.customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${order.customer.email}`} className="text-primary hover:underline">
                        {order.customer.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Контакты исполнителя (видны заказчику после выбора) */}
            {isCustomer && order.executor && (
              <div className="pt-4 border-t bg-green-50 -mx-6 px-6 py-4">
                <h3 className="font-semibold mb-3">Контакты исполнителя</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>{order.executor.fullName}</strong>
                    <span className="ml-2 text-muted-foreground">
                      ⭐ {order.executor.rating.toFixed(1)} ({order.executor.completedOrders} заказов)
                    </span>
                  </p>
                  {order.executor.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${order.executor.phone}`} className="text-primary hover:underline">
                        {order.executor.phone}
                      </a>
                    </div>
                  )}
                  {order.executor.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${order.executor.email}`} className="text-primary hover:underline">
                        {order.executor.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 flex-wrap">
              {canRespond && !hasResponded && (
                <Button onClick={handleRespond} disabled={actionLoading} className="flex-1">
                  {actionLoading ? 'Отправка...' : 'Откликнуться на заказ'}
                </Button>
              )}
              
              {hasResponded && (
                <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-900">Отклик отправлен!</p>
                    <p className="text-sm text-green-700">
                      Заказчик рассмотрит ваш отклик и свяжется с вами
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/executor/dashboard')}
                    className="border-green-300 hover:bg-green-100"
                  >
                    Мои отклики
                  </Button>
                </div>
              )}

              {isAssignedExecutor && order.status === 'IN_PROGRESS' && !order.workStartedAt && (
                <Button onClick={handleStartWork} disabled={actionLoading} className="flex-1">
                  Приступить к работе
                </Button>
              )}

              {isAssignedExecutor && order.status === 'IN_PROGRESS' && order.workStartedAt && (
                <Button onClick={handleCompleteOrder} disabled={actionLoading} className="flex-1">
                  Заказ выполнен
                </Button>
              )}

              {isAssignedExecutor && order.status === 'IN_PROGRESS' && (
                <Button onClick={handleCancelWork} disabled={actionLoading} variant="outline">
                  Отказаться от заказа
                </Button>
              )}

              {isCustomer && order.status === 'PUBLISHED' && (
                <Button onClick={handleCancelOrder} disabled={actionLoading} variant="destructive">
                  Отменить заказ
                </Button>
              )}

              {/* Кнопка оставить отзыв после завершения */}
              {order.status === 'COMPLETED' && (isCustomer || isAssignedExecutor) && (
                <Button
                  onClick={() => router.push(`/orders/${orderId}/review`)}
                  variant="outline"
                  className="flex-1"
                >
                  Оставить отзыв
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Responses Section (для заказчика) */}
        {isCustomer && responses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Отклики ({responses.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {responses.map((response) => (
                  <div key={response.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">{response.executor?.fullName}</h4>
                        <p className="text-sm text-muted-foreground">
                          ⭐ {response.executor?.rating.toFixed(1)} • {response.executor?.completedOrders} заказов
                        </p>
                        {response.executor?.executorProfile?.bio && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {response.executor.executorProfile.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground mb-3">
                      Откликнулся: {new Date(response.createdAt).toLocaleString('ru-RU')}
                    </div>

                    {order.status === 'PUBLISHED' && response.status === 'PENDING' && (
                      <Button
                        onClick={() => handleSelectExecutor(response.executorId)}
                        disabled={actionLoading}
                        size="sm"
                      >
                        Выбрать исполнителя
                      </Button>
                    )}

                    {response.status === 'ACCEPTED' && (
                      <span className="text-sm text-green-600 font-medium">✓ Выбран</span>
                    )}

                    {response.status === 'REJECTED' && (
                      <span className="text-sm text-gray-500">Отклонён</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {isCustomer && responses.length === 0 && order.status === 'PUBLISHED' && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Пока нет откликов на этот заказ</p>
            </CardContent>
          </Card>
        )}

        {/* Чат - показывается только когда заказ в работе или завершён */}
        {(order.status === 'IN_PROGRESS' || order.status === 'COMPLETED') && 
         (isCustomer || isAssignedExecutor) && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Чат с {isCustomer ? 'исполнителем' : 'заказчиком'}
            </h2>
            <ChatBox 
              orderId={orderId} 
              otherUserId={isCustomer ? order.executorId || undefined : order.customerId}
            />
          </div>
        )}
      </div>
    </div>
  );
}

