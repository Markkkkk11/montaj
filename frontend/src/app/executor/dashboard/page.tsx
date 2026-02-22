'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderCard } from '@/components/orders/OrderCard';
import { ordersApi } from '@/lib/api/orders';
import { responsesApi } from '@/lib/api/responses';
import { Order, Response } from '@/lib/types';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { TARIFF_LABELS, isExecutorProfileComplete } from '@/lib/utils';
import { Wallet, FileText, User, Star, Search, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function ExecutorDashboard() {
  const { user, logout, isHydrated } = useAuthStore();
  const router = useRouter();
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [myResponses, setMyResponses] = useState<Response[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bonusBannerClosed, setBonusBannerClosed] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'EXECUTOR') {
      router.push('/customer/dashboard');
      return;
    }
    
    // Загрузить состояние баннера из localStorage
    const closedBanners = localStorage.getItem('closedBanners');
    if (closedBanners) {
      try {
        const banners = JSON.parse(closedBanners);
        setBonusBannerClosed(banners.bonusBanner || false);
      } catch (e) {
        console.error('Error parsing closedBanners:', e);
      }
    }
    
    loadData();
  }, [user, router, isHydrated]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [orders, responses] = await Promise.all([
        ordersApi.getMyOrders(),
        responsesApi.getMyResponses(),
      ]);
      console.log('📊 Loaded orders:', orders);
      console.log('📊 Loaded responses:', responses);
      setMyOrders(orders);
      setMyResponses(responses);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseBonusBanner = () => {
    setBonusBannerClosed(true);
    
    // Сохранить в localStorage
    const closedBanners = localStorage.getItem('closedBanners');
    let banners = {};
    if (closedBanners) {
      try {
        banners = JSON.parse(closedBanners);
      } catch (e) {
        console.error('Error parsing closedBanners:', e);
      }
    }
    banners = { ...banners, bonusBanner: true };
    localStorage.setItem('closedBanners', JSON.stringify(banners));
  };

  if (!isHydrated || !user) {
    return null;
  }

  // Проверка роли - только для исполнителей
  if (user.role === 'ADMIN') {
    router.push('/admin');
    return null;
  }
  if (user.role === 'CUSTOMER') {
    router.push('/customer/dashboard');
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const balance = user.balance;
  const subscription = user.subscription;
  const profile = user.executorProfile;

  const totalBalance = balance && balance.amount !== undefined && balance.bonusAmount !== undefined
    ? (parseFloat(balance.amount.toString()) + parseFloat(balance.bonusAmount.toString())).toFixed(2)
    : '0.00';

  const activeOrders = myOrders.filter(o => o.status === 'IN_PROGRESS');
  const completedOrders = myOrders.filter(o => o.status === 'COMPLETED');
  const pendingResponses = myResponses.filter(r => r.status === 'PENDING');
  
  console.log('📊 Active orders:', activeOrders);
  console.log('📊 All my orders:', myOrders);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/executor/dashboard')}>
            <img src="/logo.jpg" alt="Монтаж" className="h-12 w-12 rounded-lg object-cover shadow-sm" />
            <span className="text-xl font-bold text-primary hidden sm:inline">Монтаж</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors hidden sm:inline">
              Обратная связь
            </Link>
            <NotificationBell />
            <span className="text-sm text-muted-foreground">{user.fullName}</span>
            <Button variant="outline" onClick={handleLogout}>
              Выйти
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Личный кабинет исполнителя</h2>
          <p className="text-muted-foreground">
            Добро пожаловать, {user.fullName}!
          </p>
        </div>

        {/* Status Warnings */}
        {user.status === 'PENDING' && (
          <Card className="mb-6 bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle>Профиль на модерации</CardTitle>
              <CardDescription>
                Ваш профиль проверяется администратором. После активации вы сможете откликаться на
                заказы.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/profile')}>
                Заполнить профиль
              </Button>
            </CardContent>
          </Card>
        )}

        {!isExecutorProfileComplete(user) && user.status === 'ACTIVE' && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle>Заполните профиль исполнителя</CardTitle>
              <CardDescription>
                Укажите регион работы, специализации и краткое описание, чтобы получать подходящие заказы
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/profile/edit')}>
                Заполнить профиль
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Welcome Bonus */}
        {!bonusBannerClosed && 
         balance && 
         balance.bonusAmount !== undefined && 
         parseFloat(balance.bonusAmount.toString()) > 0 && (
          <Card className="mb-6 bg-green-50 border-green-200">
            <CardHeader className="relative">
              <button
                onClick={handleCloseBonusBanner}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Закрыть"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <CardTitle>🎁 Приветственный бонус</CardTitle>
              <CardDescription>
                На ваш счёт зачислено {balance.bonusAmount} ₽ бонусов! Используйте их для первых
                откликов на заказы.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Баланс</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalBalance} ₽</p>
              <p className="text-sm text-muted-foreground">
                Бонусы: {balance?.bonusAmount || '0.00'} ₽
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Текущий тариф</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {subscription ? TARIFF_LABELS[subscription.tariffType] : 'Стандарт'}
              </p>
              {subscription && subscription.expiresAt && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Действует до {new Date(subscription.expiresAt).toLocaleDateString('ru-RU')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Специализаций: {subscription.specializationCount}
                  </p>
                </>
              )}
              {!subscription && (
                <p className="text-sm text-muted-foreground">
                  Базовый тариф
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Рейтинг</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{user.rating.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">из 5.0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Выполнено</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{user.completedOrders}</p>
              <p className="text-sm text-muted-foreground">заказов</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/orders')}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                <CardTitle>Доступные заказы</CardTitle>
              </div>
              <CardDescription>Просмотрите заказы и откликнитесь</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Смотреть заказы
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/profile')}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Мой профиль</CardTitle>
              </div>
              <CardDescription>Заполните профиль для модерации</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Перейти в профиль
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                <CardTitle>Пополнить баланс</CardTitle>
              </div>
              <CardDescription>Пополните баланс для откликов</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Пополнить (скоро)
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Управление тарифом</CardTitle>
            <CardDescription>
              Ваш текущий тариф и доступные возможности
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Current Tariff Info */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-lg">
                    {subscription ? TARIFF_LABELS[subscription.tariffType] : 'Стандарт'}
                  </h3>
                  {subscription && subscription.expiresAt && (
                    <p className="text-sm text-muted-foreground">
                      Активен до {new Date(subscription.expiresAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  )}
                </div>
                <Button onClick={() => router.push('/executor/tariffs')} variant="outline">
                  Изменить тариф
                </Button>
              </div>

              {/* Tariff Features */}
              <div className="grid md:grid-cols-3 gap-4">
                {subscription?.tariffType === 'STANDARD' && (
                  <>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm font-medium">Стоимость отклика</p>
                      <p className="text-2xl font-bold text-primary">150 ₽</p>
                      <p className="text-xs text-muted-foreground">за каждый отклик</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm font-medium">Специализации</p>
                      <p className="text-2xl font-bold">1</p>
                      <p className="text-xs text-muted-foreground">доступна</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm font-medium">Переключение</p>
                      <p className="text-sm">✅ Да</p>
                      <p className="text-xs text-muted-foreground">между специализациями</p>
                    </div>
                  </>
                )}

                {subscription?.tariffType === 'COMFORT' && (
                  <>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm font-medium">Оплата</p>
                      <p className="text-2xl font-bold text-primary">500 ₽</p>
                      <p className="text-xs text-muted-foreground">только за взятый заказ</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm font-medium">Специализации</p>
                      <p className="text-2xl font-bold">1</p>
                      <p className="text-xs text-muted-foreground">доступна</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm font-medium">Возврат средств</p>
                      <p className="text-sm">✅ Да</p>
                      <p className="text-xs text-muted-foreground">при отмене заказчиком</p>
                    </div>
                  </>
                )}

                {subscription?.tariffType === 'PREMIUM' && (
                  <>
                    <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                      <p className="text-sm font-medium">Стоимость</p>
                      <p className="text-2xl font-bold text-primary">5000 ₽</p>
                      <p className="text-xs text-muted-foreground">за 30 дней</p>
                    </div>
                    <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                      <p className="text-sm font-medium">Специализации</p>
                      <p className="text-2xl font-bold">до {subscription.specializationCount}</p>
                      <p className="text-xs text-muted-foreground">одновременно</p>
                    </div>
                    <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                      <p className="text-sm font-medium">Отклики</p>
                      <p className="text-2xl font-bold">∞</p>
                      <p className="text-xs text-muted-foreground">безлимитные</p>
                    </div>
                  </>
                )}

                {!subscription && (
                  <>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm font-medium">Стоимость отклика</p>
                      <p className="text-2xl font-bold text-primary">150 ₽</p>
                      <p className="text-xs text-muted-foreground">за каждый отклик</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm font-medium">Специализации</p>
                      <p className="text-2xl font-bold">1</p>
                      <p className="text-xs text-muted-foreground">доступна</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm font-medium">Возможности</p>
                      <p className="text-sm">Базовые</p>
                      <p className="text-xs text-muted-foreground">функции платформы</p>
                    </div>
                  </>
                )}
              </div>

              {/* Premium Bonus Info */}
              {subscription?.tariffType === 'PREMIUM' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">
                    🎉 Приветственный бонус при первой регистрации:
                  </p>
                  <ul className="text-sm text-green-700 mt-2 space-y-1">
                    <li>• 1000 бонусных рублей на счёт</li>
                    <li>• Тариф "Премиум" на 1 месяц бесплатно</li>
                    <li>• Стартовый рейтинг 3.0/5.0</li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Orders */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">Активные заказы ({activeOrders.length})</h3>
              <p className="text-sm text-muted-foreground">
                Заказы, которые вы выполняете
              </p>
            </div>
            {isLoading ? (
              <p className="text-muted-foreground">Загрузка...</p>
            ) : activeOrders.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-2">У вас пока нет активных заказов</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Активные заказы появятся здесь после того, как заказчик выберет вас исполнителем
                  </p>
                  <Button onClick={() => router.push('/orders')}>
                    Найти заказы
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {activeOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </div>

          {/* Completed Orders */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">Завершённые заказы ({completedOrders.length})</h3>
              <p className="text-sm text-muted-foreground">
                Ваша история выполненных работ
              </p>
            </div>
            {completedOrders.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">Нет завершённых заказов</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Здесь будут отображаться все ваши выполненные заказы
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {completedOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-4">Мои отклики ({pendingResponses.length})</h3>
            {pendingResponses.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">Нет активных откликов</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingResponses.map((response) => (
                  <Card key={response.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{response.order?.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Откликнулись: {new Date(response.createdAt).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/orders/${response.orderId}`)}
                        >
                          Открыть
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
