'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { OrderCard } from '@/components/orders/OrderCard';
import { Header } from '@/components/layout/Header';
import { ordersApi } from '@/lib/api/orders';
import { Order } from '@/lib/types';
import {
  Plus, User, Star, Mail, MessageCircle, Package,
  ChevronDown, Users, Hammer, CheckCircle2, Briefcase,
} from 'lucide-react';
import { getUserFirstName } from '@/lib/utils';

export default function CustomerDashboard() {
  const { user, isHydrated } = useAuthStore();
  const router = useRouter();
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllActive, setShowAllActive] = useState(false);
  const [showAllResponses, setShowAllResponses] = useState(false);
  const [showAllInProgress, setShowAllInProgress] = useState(false);
  const [showAllCompleted, setShowAllCompleted] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role === 'ADMIN') {
      router.push('/admin');
      return;
    }
    if (user.role === 'EXECUTOR') {
      router.push('/executor/dashboard');
      return;
    }
    loadMyOrders();
  }, [user, router, isHydrated]);

  const loadMyOrders = async () => {
    try {
      setIsLoading(true);
      const orders = await ordersApi.getMyOrders();
      setMyOrders(orders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isHydrated || !user) {
    return null;
  }

  // Категоризация заказов
  const activeOrders = myOrders.filter(o =>
    (o.status === 'PUBLISHED' && (o._count?.responses || 0) === 0) || o.status === 'PENDING'
  );
  const responseOrders = myOrders.filter(o => o.status === 'PUBLISHED' && (o._count?.responses || 0) > 0);
  const inProgressOrders = myOrders.filter(o => o.status === 'IN_PROGRESS');
  const completedOrders = myOrders.filter(o => o.status === 'COMPLETED' || o.status === 'CANCELLED');

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />

      <main className="container mx-auto px-3 sm:px-4 py-5 sm:py-8 page-enter overflow-x-hidden">
        {/* Welcome */}
        <div className="mb-5 sm:mb-8">
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-gray-900 mb-1">
            Добро пожаловать, {getUserFirstName(user.fullName)}! 👋
          </h1>
          <p className="text-xs sm:text-base text-muted-foreground">
            Управляйте заказами и следите за их выполнением
          </p>
        </div>

        {/* Status Info */}
        {user.status === 'PENDING' && (
          <div className="mb-5 sm:mb-6 p-4 sm:p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl animate-fade-in flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-xl sm:text-2xl">⏳</span>
            </div>
            <div>
              <h3 className="font-bold text-amber-900 text-sm sm:text-base">Профиль на модерации</h3>
              <p className="text-xs sm:text-sm text-amber-700 mt-1">
                Ваш профиль проверяется администратором. Это может занять до 24 часов.
              </p>
            </div>
          </div>
        )}

        {/* Stats — 5 блоков */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 mb-5 sm:mb-8 stagger-children">
          <Card
            className="cursor-pointer overflow-hidden hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-0.5"
            onClick={() => document.getElementById('section-active')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            <CardContent className="p-3 sm:pt-5 sm:px-5">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-medium text-muted-foreground leading-tight">Активные</p>
                  <p className="text-xl sm:text-2xl font-extrabold text-gray-900">{activeOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer overflow-hidden hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-0.5"
            onClick={() => document.getElementById('section-responses')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            <CardContent className="p-3 sm:pt-5 sm:px-5">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-medium text-muted-foreground leading-tight">Отклики</p>
                  <p className="text-xl sm:text-2xl font-extrabold text-gray-900">{responseOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer overflow-hidden hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-0.5"
            onClick={() => document.getElementById('section-inprogress')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            <CardContent className="p-3 sm:pt-5 sm:px-5">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Hammer className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-medium text-muted-foreground leading-tight">В работе</p>
                  <p className="text-xl sm:text-2xl font-extrabold text-gray-900">{inProgressOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer overflow-hidden hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-0.5"
            onClick={() => router.push(`/profile/${user.id}/reviews`)}
          >
            <CardContent className="p-3 sm:pt-5 sm:px-5">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-medium text-muted-foreground leading-tight">Рейтинг</p>
                  <p className="text-xl sm:text-2xl font-extrabold text-gray-900">{user.rating.toFixed(1)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer overflow-hidden hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-0.5 col-span-2 sm:col-span-1"
            onClick={() => document.getElementById('section-completed')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            <CardContent className="p-3 sm:pt-5 sm:px-5">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-medium text-muted-foreground leading-tight">Завершено</p>
                  <p className="text-xl sm:text-2xl font-extrabold text-gray-900">{completedOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-5 sm:mb-8 stagger-children">
          <Card
            className="cursor-pointer group hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 border-2 border-transparent hover:border-blue-200 overflow-hidden"
            onClick={() => router.push('/orders/create')}
          >
            <CardContent className="p-3 sm:p-5">
              <div className="flex flex-col items-center text-center sm:flex-row sm:text-left gap-1.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-11 sm:h-11 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-gray-900">Создать заказ</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Новая заявка</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer group hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 border-2 border-transparent hover:border-violet-200 overflow-hidden"
            onClick={() => router.push('/profile')}
          >
            <CardContent className="p-3 sm:p-5">
              <div className="flex flex-col items-center text-center sm:flex-row sm:text-left gap-1.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-11 sm:h-11 bg-violet-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-gray-900">Профиль</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Редактировать</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ========== Секции заказов ========== */}
        <div className="space-y-6 sm:space-y-8">

          {/* 1. Активные заказы */}
          <section id="section-active" className="scroll-mt-20">
            <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">Активные заказы</h2>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{activeOrders.length} {activeOrders.length === 1 ? 'заказ' : activeOrders.length < 5 ? 'заказа' : 'заказов'} без откликов</p>
              </div>
            </div>

            {isLoading ? (
              <div className="grid gap-3">
                {[1, 2].map(i => (
                  <div key={i} className="h-40 skeleton rounded-2xl" />
                ))}
              </div>
            ) : activeOrders.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="py-8 sm:py-12 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Package className="h-6 w-6 sm:h-8 sm:w-8 text-gray-300" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 sm:mb-4">У вас пока нет активных заказов</p>
                  <Button onClick={() => router.push('/orders/create')} className="gap-2" size="sm">
                    <Plus className="h-4 w-4" /> Создать первый заказ
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 stagger-children">
                  {(showAllActive ? activeOrders : activeOrders.slice(0, 4)).map((order) => (
                    <OrderCard key={order.id} order={order} isCustomer={true} />
                  ))}
                </div>
                {activeOrders.length > 4 && (
                  <button
                    onClick={() => setShowAllActive(!showAllActive)}
                    className="w-full mt-3 py-2.5 flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-blue-600 bg-blue-50/80 hover:bg-blue-100 rounded-xl transition-all duration-300 group"
                  >
                    {showAllActive ? 'Скрыть' : `Показать все (${activeOrders.length})`}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${showAllActive ? 'rotate-180' : 'group-hover:translate-y-0.5'}`} />
                  </button>
                )}
              </>
            )}
          </section>

          {/* 2. Отклики — заказы с откликами, исполнитель не выбран */}
          {(responseOrders.length > 0 || !isLoading) && (
            <section id="section-responses" className="scroll-mt-20">
              <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
                <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">Отклики</h2>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {responseOrders.length > 0
                      ? `${responseOrders.length} ${responseOrders.length === 1 ? 'заказ' : responseOrders.length < 5 ? 'заказа' : 'заказов'} с откликами`
                      : 'Пока нет откликов'}
                  </p>
                </div>
              </div>

              {responseOrders.length === 0 ? (
                <div className="p-4 sm:p-6 text-center bg-violet-50/30 border border-dashed border-violet-200 rounded-xl">
                  <Users className="h-6 w-6 text-violet-300 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-muted-foreground">Когда исполнители откликнутся на ваши заказы, они появятся здесь</p>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 stagger-children">
                    {(showAllResponses ? responseOrders : responseOrders.slice(0, 4)).map((order) => (
                      <OrderCard key={order.id} order={order} isCustomer={true} />
                    ))}
                  </div>
                  {responseOrders.length > 4 && (
                    <button
                      onClick={() => setShowAllResponses(!showAllResponses)}
                      className="w-full mt-3 py-2.5 flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-violet-600 bg-violet-50/80 hover:bg-violet-100 rounded-xl transition-all duration-300 group"
                    >
                      {showAllResponses ? 'Скрыть' : `Показать все (${responseOrders.length})`}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${showAllResponses ? 'rotate-180' : 'group-hover:translate-y-0.5'}`} />
                    </button>
                  )}
                </>
              )}
            </section>
          )}

          {/* 3. В работе */}
          {(inProgressOrders.length > 0 || !isLoading) && (
            <section id="section-inprogress" className="scroll-mt-20">
              <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Hammer className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">В работе</h2>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {inProgressOrders.length > 0
                      ? `${inProgressOrders.length} ${inProgressOrders.length === 1 ? 'заказ' : inProgressOrders.length < 5 ? 'заказа' : 'заказов'} в процессе`
                      : 'Нет заказов в работе'}
                  </p>
                </div>
              </div>

              {inProgressOrders.length === 0 ? (
                <div className="p-4 sm:p-6 text-center bg-amber-50/30 border border-dashed border-amber-200 rounded-xl">
                  <Hammer className="h-6 w-6 text-amber-300 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-muted-foreground">Заказы с выбранным исполнителем появятся здесь</p>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 stagger-children">
                    {(showAllInProgress ? inProgressOrders : inProgressOrders.slice(0, 4)).map((order) => (
                      <OrderCard key={order.id} order={order} isCustomer={true} />
                    ))}
                  </div>
                  {inProgressOrders.length > 4 && (
                    <button
                      onClick={() => setShowAllInProgress(!showAllInProgress)}
                      className="w-full mt-3 py-2.5 flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-amber-600 bg-amber-50/80 hover:bg-amber-100 rounded-xl transition-all duration-300 group"
                    >
                      {showAllInProgress ? 'Скрыть' : `Показать все (${inProgressOrders.length})`}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${showAllInProgress ? 'rotate-180' : 'group-hover:translate-y-0.5'}`} />
                    </button>
                  )}
                </>
              )}
            </section>
          )}

          {/* 4. Завершено */}
          {(completedOrders.length > 0 || !isLoading) && (
            <section id="section-completed" className="scroll-mt-20">
              <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">Завершённые</h2>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {completedOrders.length > 0
                      ? `${completedOrders.length} ${completedOrders.length === 1 ? 'заказ' : completedOrders.length < 5 ? 'заказа' : 'заказов'} выполнено`
                      : 'Пока нет завершённых заказов'}
                  </p>
                </div>
              </div>

              {completedOrders.length === 0 ? (
                <div className="p-4 sm:p-6 text-center bg-emerald-50/30 border border-dashed border-emerald-200 rounded-xl">
                  <CheckCircle2 className="h-6 w-6 text-emerald-300 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-muted-foreground">Завершённые заказы будут отображаться здесь</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 stagger-children">
                    {(showAllCompleted ? completedOrders : completedOrders.slice(0, 4)).map((order) => (
                      <Link key={order.id} href={`/orders/${order.id}`}>
                        <div className="p-3 bg-white rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-soft transition-all duration-200">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm truncate">
                                {order.orderNumber ? `#${order.orderNumber} — ` : ''}{order.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{order.description}</p>
                              <div className="flex items-center gap-2 sm:gap-3 mt-1.5 flex-wrap">
                                <span className="text-[10px] sm:text-xs text-muted-foreground">{order.region}</span>
                                <span className="text-[10px] sm:text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('ru-RU')}</span>
                                <span className="text-[10px] sm:text-xs font-bold text-blue-600">{parseFloat(order.budget.toString()).toLocaleString('ru-RU')} ₽</span>
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-[10px] sm:text-xs font-medium rounded-lg flex-shrink-0 border ${
                              order.status === 'CANCELLED'
                                ? 'bg-red-50 text-red-500 border-red-100'
                                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            }`}>
                              {order.status === 'CANCELLED' ? 'Отменён' : 'Завершён'}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {completedOrders.length > 4 && (
                    <button
                      onClick={() => setShowAllCompleted(!showAllCompleted)}
                      className="w-full mt-3 py-2.5 flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-emerald-600 bg-emerald-50/80 hover:bg-emerald-100 rounded-xl transition-all duration-300 group"
                    >
                      {showAllCompleted ? 'Скрыть' : `Показать все (${completedOrders.length})`}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${showAllCompleted ? 'rotate-180' : 'group-hover:translate-y-0.5'}`} />
                    </button>
                  )}
                </>
              )}
            </section>
          )}

          {/* Обратная связь — под завершёнными */}
          <div className="p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-soft">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="h-4 w-4 text-gray-400" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-gray-600">Обратная связь:</span>
              </div>
              <div className="flex flex-wrap gap-3 sm:gap-4 pl-10 sm:pl-0">
                <a href="https://e.mail.ru/compose/?to=SVMontaj24@mail.ru" className="flex items-center gap-1.5 text-xs sm:text-sm text-blue-600 hover:underline font-medium">
                  <Mail className="h-3.5 w-3.5" /> Email
                </a>
                <a href="https://t.me/SVMontaj24" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs sm:text-sm text-violet-600 hover:underline font-medium">
                  <MessageCircle className="h-3.5 w-3.5" /> Telegram
                </a>
                <a href="https://max.ru/u/f9LHodD0cOKIe-cyRoYq_Udu4_b14n0rL0vJ3BA4GWqjW0uOGlGmWjK1Vow" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs sm:text-sm text-sky-600 hover:underline font-medium">
                  <MessageCircle className="h-3.5 w-3.5" /> MAX
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
