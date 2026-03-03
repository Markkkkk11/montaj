'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TopUpForm from '@/components/payments/TopUpForm';
import PaymentHistory from '@/components/payments/PaymentHistory';
import { getBalance } from '@/lib/api/users';
import { processPaymentSuccess } from '@/lib/api/payments';
import { Wallet, TrendingUp, Gift } from 'lucide-react';

export default function BalancePage() {
  return (
    <Suspense fallback={null}>
      <BalanceContent />
    </Suspense>
  );
}

function BalanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('balance');

  useEffect(() => {
    loadBalance();

    // Обработать callback после оплаты
    const paymentId = searchParams?.get('payment_id');
    if (paymentId) {
      handlePaymentCallback(paymentId);
    }

    // Установить активную вкладку из URL
    const tab = searchParams?.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

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

  const handlePaymentCallback = async (paymentId: string) => {
    try {
      const payment = await processPaymentSuccess(paymentId);
      await loadBalance();
      if (payment?.paid) {
        setActiveTab('history');
      }
      router.replace('/profile/balance?tab=history');
    } catch (error) {
      console.error('Payment processing error:', error);
    }
  };

  if (loading) {
    return <div className="container mx-auto py-8">Загрузка...</div>;
  }

  const totalBalance = balance
    ? parseFloat(balance.amount) + parseFloat(balance.bonusAmount)
    : 0;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Баланс и платежи</h1>

        {/* Карточки баланса */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Основной баланс
              </CardTitle>
              <Wallet className="w-4 h-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {parseFloat(balance?.amount || '0').toLocaleString('ru-RU')}₽
              </div>
              <p className="text-xs text-gray-500 mt-1">Доступно для использования</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Бонусный баланс
              </CardTitle>
              <Gift className="w-4 h-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {parseFloat(balance?.bonusAmount || '0').toLocaleString('ru-RU')}₽
              </div>
              <p className="text-xs text-gray-500 mt-1">Бонусы за регистрацию</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Всего
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {totalBalance.toLocaleString('ru-RU')}₽
              </div>
              <p className="text-xs text-gray-500 mt-1">Общий баланс</p>
            </CardContent>
          </Card>
        </div>

        {/* Табы */}
        <div className="flex gap-2 mb-6 border-b">
          <Button
            variant={activeTab === 'balance' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('balance')}
            className="rounded-b-none"
          >
            Пополнение
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('history')}
            className="rounded-b-none"
          >
            История
          </Button>
        </div>

        {/* Контент вкладок */}
        {activeTab === 'balance' && (
          <div className="grid md:grid-cols-2 gap-6">
            <TopUpForm />
            <Card>
              <CardHeader>
                <CardTitle>Информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">💰 Для чего нужен баланс?</h3>
                  <p className="text-sm text-gray-600">
                    Баланс используется для оплаты откликов на заказы и подписок.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">🎁 Бонусный баланс</h3>
                  <p className="text-sm text-gray-600">
                    Бонусы списываются первыми при оплате откликов и подписок.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                  <h3 className="font-semibold mb-1 text-green-800">🎉 Акция для новых пользователей!</h3>
                  <p className="text-sm text-green-700">
                    Пополните баланс на сумму от <strong>150₽</strong> в течение <strong>30 дней</strong> после регистрации
                    и получите бонус <strong>1 000₽</strong> на бонусный баланс!
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">💳 Способы оплаты</h3>
                  <p className="text-sm text-gray-600">
                    Банковская карта, ЮMoney, QIWI и другие через ЮKassa.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">🔒 Безопасность</h3>
                  <p className="text-sm text-gray-600">
                    Все платежи защищены и обрабатываются через защищённое соединение.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'history' && <PaymentHistory />}
      </div>
    </div>
  );
}

