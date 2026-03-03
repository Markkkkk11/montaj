'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderCard } from '@/components/orders/OrderCard';
import { Header } from '@/components/layout/Header';
import { ordersApi } from '@/lib/api/orders';
import { responsesApi } from '@/lib/api/responses';
import { Order, Response } from '@/lib/types';
import { TARIFF_LABELS, getUserFirstName, isExecutorProfileComplete } from '@/lib/utils';
import { Wallet, FileText, User, Star, Search, Mail, MessageCircle, ArrowRight, TrendingUp, Zap, Package, ChevronRight, ChevronDown, Gift, X, HelpCircle, Info } from 'lucide-react';

export default function ExecutorDashboard() {
  const { user, logout, isHydrated } = useAuthStore();
  const router = useRouter();
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [myResponses, setMyResponses] = useState<Response[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bonusBannerClosed, setBonusBannerClosed] = useState(false);
  const [balanceInfoClosed, setBalanceInfoClosed] = useState(false);
  const [showAllActive, setShowAllActive] = useState(false);
  const [showAllCompleted, setShowAllCompleted] = useState(false);

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
    
    const storageKey = `closedBanners_${user.id}`;
    const closedBanners = localStorage.getItem(storageKey);
    if (closedBanners) {
      try {
        const banners = JSON.parse(closedBanners);
        setBonusBannerClosed(banners.bonusBanner || false);
        setBalanceInfoClosed(banners.balanceInfo || false);
      } catch (e) {
        console.error('Error parsing closedBanners:', e);
      }
    } else {
      setBonusBannerClosed(false);
      setBalanceInfoClosed(false);
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
      setMyOrders(orders);
      setMyResponses(responses);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseBonusBanner = () => {
    if (!user) return;
    setBonusBannerClosed(true);
    const storageKey = `closedBanners_${user.id}`;
    const closedBanners = localStorage.getItem(storageKey);
    let banners = {};
    if (closedBanners) {
      try {
        banners = JSON.parse(closedBanners);
      } catch (e) {
        console.error('Error parsing closedBanners:', e);
      }
    }
    banners = { ...banners, bonusBanner: true };
    localStorage.setItem(storageKey, JSON.stringify(banners));
  };

  const handleCloseBalanceInfo = () => {
    if (!user) return;
    setBalanceInfoClosed(true);
    const storageKey = `closedBanners_${user.id}`;
    const closedBanners = localStorage.getItem(storageKey);
    let banners: any = {};
    if (closedBanners) {
      try {
        banners = JSON.parse(closedBanners);
      } catch (e) {}
    }
    banners = { ...banners, balanceInfo: true };
    localStorage.setItem(storageKey, JSON.stringify(banners));
  };

  if (!isHydrated || !user) {
    return null;
  }

  if (user.role === 'ADMIN') {
    router.push('/admin');
    return null;
  }
  if (user.role === 'CUSTOMER') {
    router.push('/customer/dashboard');
    return null;
  }

  const balance = user.balance;
  const subscription = user.subscription;
  const profile = user.executorProfile;

  const totalBalance = balance && balance.amount !== undefined && balance.bonusAmount !== undefined
    ? (parseFloat(balance.amount.toString()) + parseFloat(balance.bonusAmount.toString())).toFixed(2)
    : '0.00';

  const activeOrders = myOrders.filter(o => o.status === 'IN_PROGRESS');
  const completedOrders = myOrders.filter(o => o.status === 'COMPLETED');
  const pendingResponses = myResponses.filter(r => r.status === 'PENDING');

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />

      <main className="container mx-auto px-3 sm:px-4 py-5 sm:py-8 page-enter overflow-x-hidden">
        {/* Welcome */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 mb-1">
            Добро пожаловать, {getUserFirstName(user.fullName)}! 🔧
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Находите заказы и зарабатывайте
          </p>
        </div>

        {/* Status Warnings */}
        {user.status === 'PENDING' && (
          <div className="mb-6 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl animate-fade-in flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">⏳</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-900">Профиль на модерации</h3>
              <p className="text-sm text-amber-700 mt-1">
                После активации вы сможете откликаться на заказы.
              </p>
              <Button onClick={() => router.push('/profile')} size="sm" className="mt-3">
                Заполнить профиль
              </Button>
            </div>
          </div>
        )}

        {!isExecutorProfileComplete(user) && user.status === 'ACTIVE' && (
          <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl animate-fade-in flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">📝</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-blue-900">Заполните профиль</h3>
              <p className="text-sm text-blue-700 mt-1">
                Укажите регион работы, специализации и описание
              </p>
              <Button onClick={() => router.push('/profile/edit')} size="sm" className="mt-3">
                Заполнить
              </Button>
            </div>
          </div>
        )}

        {/* Welcome Bonus */}
        {!bonusBannerClosed && balance && balance.bonusAmount !== undefined && parseFloat(balance.bonusAmount.toString()) > 0 && (
          <div className="mb-6 p-5 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl animate-fade-in flex items-start gap-4 relative">
            <button
              onClick={handleCloseBonusBanner}
              className="absolute top-2.5 right-2.5 p-2 hover:bg-emerald-100 rounded-xl transition-colors"
            >
              <X className="h-6 w-6 text-emerald-500" />
            </button>
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Gift className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="pr-8">
              <h3 className="font-bold text-emerald-900">Бонусы на вашем счёте</h3>
              <p className="text-sm text-emerald-700 mt-1">
                На вашем счету <strong>{balance.bonusAmount} ₽</strong> бонусов! Бонусы начисляются при первом пополнении баланса от 150₽ (1000 бонусных рублей). Используйте бонусы для оплаты откликов на заказы — они списываются в первую очередь.
              </p>
            </div>
          </div>
        )}

        {/* Balance & Bonus Info */}
        {!balanceInfoClosed && (
          <Card className="mb-6 overflow-hidden border-blue-100 relative">
            <button
              onClick={handleCloseBalanceInfo}
              className="absolute top-2.5 right-2.5 p-2 hover:bg-blue-100 rounded-xl transition-colors z-10"
              title="Закрыть"
            >
              <X className="h-6 w-6 text-blue-400" />
            </button>
            <CardHeader className="pb-3 pr-12">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0" /> Баланс и Бонусы
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-100">
                  <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <Wallet className="h-4 w-4" /> Что такое Баланс?
                  </h4>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    Баланс — это ваш основной счёт на платформе. С него списывается оплата за отклики на заказы.
                    Пополнить баланс можно нажав на карточку «Баланс» выше или через раздел пополнения.
                  </p>
                </div>
                <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-100">
                  <h4 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                    <Gift className="h-4 w-4" /> Что такое Бонусы?
                  </h4>
                  <p className="text-sm text-emerald-800 leading-relaxed">
                    Бонусы — это дополнительные средства, которые можно использовать для оплаты откликов. При списании сначала используются бонусы, затем основной баланс.
                    <strong> 1000 бонусных рублей</strong> начисляется после первого пополнения баланса на сумму от 150₽ (в течение 30 дней после регистрации).
                  </p>
                </div>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  <strong>Как пополнить баланс?</strong> Нажмите на карточку «Баланс» выше или кнопку «Пополнить →» — вы перейдёте на страницу пополнения через ЮKassa (банковские карты, SberPay, ЮMoney и др.).
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid — vertical on mobile, 5 cols on desktop */}
        <div className="mb-6 sm:mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 stagger-children">
            <Card className="cursor-pointer hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-0.5" onClick={() => router.push('/executor/balance')}>
              <CardContent className="pt-4 pb-4 sm:pt-5 sm:pb-5">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">Баланс</p>
                    <p className="text-base sm:text-lg font-extrabold text-gray-900 truncate">{balance?.amount || '0'} ₽</p>
                    <p className="text-[10px] text-blue-600 font-semibold">Пополнить →</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-0.5 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100">
              <CardContent className="pt-4 pb-4 sm:pt-5 sm:pb-5">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-medium text-emerald-600">Бонусы</p>
                    <p className="text-base sm:text-lg font-extrabold text-emerald-700 truncate">{balance?.bonusAmount || '0'} ₽</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-0.5 order-5 sm:order-3 col-span-2 sm:col-span-1">
              <CardContent className="pt-4 pb-4 sm:pt-5 sm:pb-5">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">Тариф</p>
                    <p className="text-base sm:text-lg font-extrabold text-gray-900 truncate">{subscription ? TARIFF_LABELS[subscription.tariffType] : 'Стандарт'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-0.5 order-4 sm:order-4" onClick={() => router.push(`/profile/${user.id}/reviews`)}>
              <CardContent className="pt-4 pb-4 sm:pt-5 sm:pb-5">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Star className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">Рейтинг</p>
                    <p className="text-base sm:text-lg font-extrabold text-gray-900">{user.rating.toFixed(1)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-0.5 order-3 sm:order-5" onClick={() => document.getElementById('completed-orders')?.scrollIntoView({ behavior: 'smooth' })}>
              <CardContent className="pt-4 pb-4 sm:pt-5 sm:pb-5">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-sky-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">Выполнено</p>
                    <p className="text-base sm:text-lg font-extrabold text-gray-900">{user.completedOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions: Заказы, Профиль, Тарифы */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8 stagger-children">
          <Card
            className="cursor-pointer group hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 border-2 border-transparent hover:border-blue-200"
            onClick={() => router.push('/orders')}
          >
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col items-center text-center sm:flex-row sm:text-left gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                  <Search className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-bold text-gray-900">Заказы</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Найти работу</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer group hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 border-2 border-transparent hover:border-violet-200"
            onClick={() => router.push('/profile')}
          >
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col items-center text-center sm:flex-row sm:text-left gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 bg-violet-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                  <User className="h-5 w-5 sm:h-6 sm:w-6 text-violet-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-bold text-gray-900">Профиль</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Редактировать</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer group hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 border-2 border-transparent hover:border-amber-200"
            onClick={() => router.push('/executor/tariffs')}
          >
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col items-center text-center sm:flex-row sm:text-left gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 bg-amber-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-bold text-gray-900">Тарифы</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Подробности</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick scroll buttons: Мои отклики / Активные заказы */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-6 sm:mb-8">
            <button
            onClick={() => document.getElementById('my-responses')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl hover:shadow-soft-lg hover:-translate-y-0.5 transition-all duration-300 group"
          >
            <span className="text-xl sm:text-2xl">📩</span>
            <div className="text-left min-w-0">
              <p className="font-bold text-blue-900 text-sm sm:text-base">Мои отклики</p>
              <p className="text-[10px] sm:text-xs text-blue-600">{pendingResponses.length} ожидают</p>
            </div>
            <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 group-hover:translate-y-0.5 transition-transform hidden sm:block" />
            </button>
          <button
            onClick={() => document.getElementById('active-orders')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl hover:shadow-soft-lg hover:-translate-y-0.5 transition-all duration-300 group"
          >
            <span className="text-xl sm:text-2xl">📋</span>
            <div className="text-left min-w-0">
              <p className="font-bold text-emerald-900 text-sm sm:text-base">Активные заказы</p>
              <p className="text-[10px] sm:text-xs text-emerald-600">{activeOrders.length} в работе</p>
                </div>
            <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 group-hover:translate-y-0.5 transition-transform hidden sm:block" />
          </button>
              </div>

        {/* Tariff Management */}
        <Card className="mb-6 sm:mb-8 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-blue-500" />
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Управление тарифом</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl mb-4 gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base truncate">{subscription ? TARIFF_LABELS[subscription.tariffType] : 'Стандарт'}</h3>
                  {subscription?.expiresAt && (
                    <p className="text-xs text-muted-foreground">
                      до {new Date(subscription.expiresAt).toLocaleDateString('ru-RU')}
                    </p>
                  )}
                </div>
              </div>
              <Button onClick={() => router.push('/executor/tariffs')} variant="outline" size="sm" className="gap-1 flex-shrink-0 text-xs sm:text-sm">
                Изменить <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="p-3 sm:p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-0.5 sm:mb-1">Стоимость отклика</p>
                <p className="text-lg sm:text-xl font-extrabold text-blue-600">
                  {subscription?.tariffType === 'PREMIUM' || subscription?.tariffType === 'COMFORT' ? '0' : '150'} ₽
                </p>
              </div>
              <div className="p-3 sm:p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-0.5 sm:mb-1">Специализации</p>
                <p className="text-lg sm:text-xl font-extrabold text-violet-600">
                  {subscription?.tariffType === 'PREMIUM' ? `до ${subscription.specializationCount}` : '1'}
                </p>
              </div>
              <div className="p-3 sm:p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-0.5 sm:mb-1">Отклики</p>
                <p className="text-lg sm:text-xl font-extrabold text-emerald-600">
                  {subscription?.tariffType === 'PREMIUM' ? '∞' : 'Платные'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* My Responses */}
        <div className="space-y-8">
          <div id="my-responses">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="section-title flex items-center gap-2">
                  <span>📩</span> Мои отклики
                </h2>
                <p className="section-subtitle">{pendingResponses.length} ожидают</p>
              </div>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="h-20 skeleton rounded-2xl" />)}
              </div>
            ) : pendingResponses.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-3">Нет активных откликов</p>
                  <Button variant="outline" onClick={() => router.push('/orders')} className="gap-2">
                    <Search className="h-4 w-4" /> Найти заказы
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 stagger-children">
                {pendingResponses.map((response) => (
                  <Card key={response.id} className="hover:shadow-soft-lg transition-all duration-300">
                    <CardContent className="pt-4 pb-4 sm:pt-5 sm:pb-5">
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 truncate text-sm sm:text-base">{response.order?.title}</h4>
                          <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                            <span className="text-xs text-muted-foreground">
                              {new Date(response.createdAt).toLocaleDateString('ru-RU')}
                            </span>
                            <span className="badge-warning">Ожидание</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/orders/${response.orderId}`)}
                          className="gap-1 flex-shrink-0 text-xs sm:text-sm"
                        >
                          <span className="hidden sm:inline">Открыть</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Active Orders */}
          <div id="active-orders">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="section-title">Активные заказы</h2>
                <p className="section-subtitle">{activeOrders.length} в работе</p>
              </div>
            </div>
            {activeOrders.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="py-8 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Package className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="text-muted-foreground">Активные заказы появятся после того, как вас выберут</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-4 stagger-children">
                  {(showAllActive ? activeOrders : activeOrders.slice(0, 4)).map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
                {activeOrders.length > 4 && (
                  <button
                    onClick={() => setShowAllActive(!showAllActive)}
                    className="w-full mt-4 py-3 flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50/80 hover:bg-blue-100 rounded-2xl transition-all duration-300 group"
                  >
                    {showAllActive ? 'Скрыть' : `Показать все (${activeOrders.length})`}
                    <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${showAllActive ? 'rotate-180' : 'group-hover:translate-y-0.5'}`} />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Completed Orders */}
          <div id="completed-orders">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="section-title">Завершённые заказы</h2>
                <p className="section-subtitle">{completedOrders.length} выполнено</p>
              </div>
            </div>
            {completedOrders.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">Нет завершённых заказов</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {showAllCompleted && (
                  <div className="space-y-2 stagger-children">
                    {completedOrders.map((order) => (
                      <div key={order.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {order.orderNumber ? `#${order.orderNumber} — ` : ''}{order.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{order.description}</p>
                            <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                              <span className="text-xs text-muted-foreground">{order.region}</span>
                              <span className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('ru-RU')}</span>
                              <span className="text-xs font-bold text-blue-600">{Math.round(Number(order.budget)).toLocaleString('ru-RU')} ₽</span>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-lg flex-shrink-0">Завершён</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setShowAllCompleted(!showAllCompleted)}
                  className="w-full mt-2 py-3 flex items-center justify-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50/80 hover:bg-emerald-100 rounded-2xl transition-all duration-300 group"
                >
                  {showAllCompleted ? 'Скрыть' : `Показать все (${completedOrders.length})`}
                  <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${showAllCompleted ? 'rotate-180' : 'group-hover:translate-y-0.5'}`} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Feedback — at the bottom */}
        <div className="mb-8 mt-8 p-3 sm:p-4 bg-white rounded-2xl border border-gray-100 shadow-soft">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-5 w-5 text-gray-400" />
              </div>
              <span className="text-sm font-semibold text-gray-600">Обратная связь:</span>
            </div>
            <div className="flex flex-wrap gap-3 sm:gap-4 pl-12 sm:pl-0">
              <a href="https://e.mail.ru/compose/?to=SVMontaj24@mail.ru" className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium">
                <Mail className="h-4 w-4" /> Email
              </a>
              <a href="https://max.ru/u/f9LHodD0cOKIe-cyRoYq_Udu4_b14n0rL0vJ3BA4GWqjW0uOGlGmWjK1Vow" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-sky-600 hover:underline font-medium">
                <MessageCircle className="h-4 w-4" /> MAX
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
