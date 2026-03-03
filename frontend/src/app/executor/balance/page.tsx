'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Gift, TrendingUp, ArrowLeft, CreditCard, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { getBalance } from '@/lib/api/users';
import { createTopUpPayment, processPaymentSuccess, getPaymentHistory, Payment } from '@/lib/api/payments';
import { useToast } from '@/hooks/use-toast';

const PRESET_AMOUNTS = [150, 300, 500, 1000, 2000, 5000];

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ожидает',
  PROCESSING: 'Обрабатывается',
  SUCCEEDED: 'Успешно',
  CANCELLED: 'Отменён',
  FAILED: 'Ошибка',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SUCCEEDED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  FAILED: 'bg-red-100 text-red-800',
};

export default function ExecutorBalancePage() {
  return (
    <Suspense fallback={null}>
      <ExecutorBalanceContent />
    </Suspense>
  );
}

function ExecutorBalanceContent() {
  const { user, isHydrated } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // История платежей
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

    loadBalance();

    // Обработать callback после оплаты ЮKassa
    const paymentId = searchParams?.get('payment_id');
    if (paymentId) {
      handlePaymentCallback(paymentId);
    }
  }, [user, router, isHydrated, searchParams]);

  const loadBalance = async () => {
    try {
      const data = await getBalance();
      setBalance(data);
    } catch (error) {
      console.error('Failed to load balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async (p: number = 1) => {
    try {
      setPaymentsLoading(true);
      const data = await getPaymentHistory(p, 10);
      setPayments(data.payments);
      setTotalPages(data.totalPages);
      setPage(p);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handlePaymentCallback = async (paymentId: string) => {
    try {
      const payment = await processPaymentSuccess(paymentId);
      await loadBalance();

      if (payment?.paid) {
        setPaymentSuccess(true);
        toast({
          title: 'Платёж успешно обработан!',
          description: 'Баланс пополнен',
        });
      } else {
        toast({
          title: 'Платёж не завершён',
          description: 'Оплата не была произведена. Попробуйте ещё раз.',
          variant: 'destructive',
        });
      }
      router.replace('/executor/balance');
    } catch (error: any) {
      console.error('Payment processing error:', error);
      toast({
        title: 'Ошибка обработки платежа',
        description: error.response?.data?.error || 'Попробуйте позже',
        variant: 'destructive',
      });
      router.replace('/executor/balance');
    }
  };

  const handleTopUp = async () => {
    try {
      setTopUpLoading(true);
      setError(null);

      const finalAmount = customAmount ? parseFloat(customAmount) : amount;

      if (!finalAmount || finalAmount < 100) {
        setError('Минимальная сумма пополнения — 100₽');
        return;
      }

      if (finalAmount > 100000) {
        setError('Максимальная сумма пополнения — 100 000₽');
        return;
      }

      const result = await createTopUpPayment(finalAmount);

      // Перенаправить на страницу оплаты ЮKassa
      if (result.confirmationUrl) {
        window.location.href = result.confirmationUrl;
      } else {
        setError('Не удалось получить ссылку на оплату');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка создания платежа');
    } finally {
      setTopUpLoading(false);
    }
  };

  if (!isHydrated || !user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <Header />
        <main className="container mx-auto px-3 sm:px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3" />
              <div className="h-32 bg-gray-200 rounded" />
              <div className="h-64 bg-gray-200 rounded" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const balanceAmount = parseFloat(balance?.amount || '0');
  const bonusAmount = parseFloat(balance?.bonusAmount || '0');
  const totalBalance = balanceAmount + bonusAmount;
  const finalAmount = customAmount ? parseFloat(customAmount) || 0 : amount;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />

      <main className="container mx-auto px-3 sm:px-4 py-5 sm:py-8 page-enter overflow-x-hidden">
        <div className="max-w-2xl mx-auto">
          {/* Навигация */}
          <button
            onClick={() => router.push('/executor/dashboard')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-5 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад к панели
          </button>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 mb-6">
            Баланс и пополнение
          </h1>

          {/* Уведомление об успешной оплате */}
          {paymentSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-start gap-3 animate-fade-in">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Оплата прошла успешно!</p>
                <p className="text-sm text-green-700 mt-0.5">Средства зачислены на ваш баланс.</p>
              </div>
            </div>
          )}

          {/* Карточки баланса */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <Wallet className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-[10px] sm:text-xs text-gray-500">Основной</p>
                  <p className="text-lg sm:text-xl font-extrabold text-gray-900">
                    {balanceAmount.toLocaleString('ru-RU')}₽
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100">
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <Gift className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                  <p className="text-[10px] sm:text-xs text-emerald-600">Бонусы</p>
                  <p className="text-lg sm:text-xl font-extrabold text-emerald-700">
                    {bonusAmount.toLocaleString('ru-RU')}₽
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <TrendingUp className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-[10px] sm:text-xs text-blue-600">Всего</p>
                  <p className="text-lg sm:text-xl font-extrabold text-blue-700">
                    {totalBalance.toLocaleString('ru-RU')}₽
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Форма пополнения */}
          <Card className="mb-6 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-blue-500" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Пополнение баланса
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Пресеты */}
              <div>
                <Label className="text-sm font-medium">Быстрый выбор суммы</Label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2">
                  {PRESET_AMOUNTS.map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant={amount === preset && !customAmount ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setAmount(preset);
                        setCustomAmount('');
                        setError(null);
                      }}
                      className="text-sm"
                    >
                      {preset}₽
                    </Button>
                  ))}
                </div>
              </div>

              {/* Своя сумма */}
              <div>
                <Label htmlFor="customAmount" className="text-sm font-medium">
                  Или введите свою сумму
                </Label>
                <Input
                  id="customAmount"
                  type="number"
                  placeholder="Минимум 100₽"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setAmount(0);
                    setError(null);
                  }}
                  min={100}
                  max={100000}
                  className="mt-1"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {/* Итого */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-gray-700">К оплате:</span>
                  <span className="text-blue-700">{finalAmount.toLocaleString('ru-RU')}₽</span>
                </div>
              </div>

              <Button
                onClick={handleTopUp}
                disabled={topUpLoading || (!amount && !customAmount)}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                {topUpLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Создание платежа...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Перейти к оплате
                  </span>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <Shield className="h-3.5 w-3.5" />
                Безопасная оплата через ЮKassa
              </div>
            </CardContent>
          </Card>

          {/* Акция */}
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl">
            <h3 className="font-semibold text-green-800 mb-1">🎉 Акция для новых пользователей!</h3>
            <p className="text-sm text-green-700">
              Пополните баланс на сумму от <strong>150₽</strong> в течение <strong>30 дней</strong> после регистрации
              и получите бонус <strong>1 000₽</strong> на бонусный баланс!
            </p>
          </div>

          {/* Информация */}
          <Card className="mb-6">
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-lg">💰</span>
                <div>
                  <p className="font-medium text-sm">Для чего нужен баланс?</p>
                  <p className="text-xs text-gray-500">Баланс используется для оплаты откликов на заказы и подписок.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">🎁</span>
                <div>
                  <p className="font-medium text-sm">Бонусный баланс</p>
                  <p className="text-xs text-gray-500">Бонусы списываются первыми при оплате откликов и подписок.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">💳</span>
                <div>
                  <p className="font-medium text-sm">Способы оплаты</p>
                  <p className="text-xs text-gray-500">Банковская карта, SberPay, ЮMoney и другие через ЮKassa.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* История платежей */}
          <div className="mb-8">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                if (!showHistory) {
                  loadPayments(1);
                }
                setShowHistory(!showHistory);
              }}
            >
              {showHistory ? 'Скрыть историю' : 'Показать историю платежей'}
            </Button>

            {showHistory && (
              <div className="mt-4">
                {paymentsLoading ? (
                  <div className="text-center py-8 text-gray-500 text-sm">Загрузка...</div>
                ) : payments.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500 text-sm">
                      История платежей пуста
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 bg-white border rounded-xl"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{payment.description}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(payment.createdAt).toLocaleString('ru-RU')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[payment.status]}`}>
                            {STATUS_LABELS[payment.status]}
                          </span>
                          <span className="font-bold text-sm">
                            {parseFloat(payment.amount).toLocaleString('ru-RU')}₽
                          </span>
                        </div>
                      </div>
                    ))}

                    {totalPages > 1 && (
                      <div className="flex justify-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadPayments(Math.max(1, page - 1))}
                          disabled={page === 1}
                        >
                          Назад
                        </Button>
                        <span className="flex items-center px-3 text-sm text-gray-500">
                          {page} / {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadPayments(Math.min(totalPages, page + 1))}
                          disabled={page === totalPages}
                        >
                          Далее
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

