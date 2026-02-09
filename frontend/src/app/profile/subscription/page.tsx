'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CurrentSubscription from '@/components/subscriptions/CurrentSubscription';
import TariffCard from '@/components/subscriptions/TariffCard';
import {
  getTariffInfo,
  getCurrentTariff,
  changeTariff,
  TariffInfo,
} from '@/lib/api/subscriptions';
import { createPremiumSubscriptionPayment, processPaymentSuccess } from '@/lib/api/payments';

export default function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tariffs, setTariffs] = useState<Record<string, TariffInfo>>({});
  const [currentTariffType, setCurrentTariffType] = useState<string>('STANDARD');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();

    // Обработать callback после оплаты подписки
    const paymentId = searchParams?.get('payment_id');
    if (paymentId) {
      handlePaymentCallback(paymentId);
    }
  }, [searchParams]);

  const loadData = async () => {
    try {
      const [tariffsData, currentTariff] = await Promise.all([
        getTariffInfo(),
        getCurrentTariff(),
      ]);

      setTariffs(tariffsData);
      setCurrentTariffType(currentTariff.tariffType);
    } catch (error) {
      console.error('Failed to load tariffs:', error);
    }
  };

  const handlePaymentCallback = async (paymentId: string) => {
    try {
      await processPaymentSuccess(paymentId);
      await loadData();
      alert('Подписка успешно активирована!');
      router.replace('/profile/subscription');
    } catch (error) {
      console.error('Payment processing error:', error);
      alert('Ошибка обработки платежа');
    }
  };

  const handleSelectTariff = async (tariffKey: string) => {
    if (tariffKey === currentTariffType) return;

    try {
      setLoading(true);

      if (tariffKey === 'PREMIUM') {
        // Создать платёж для Premium
        const { confirmationUrl } = await createPremiumSubscriptionPayment();
        window.location.href = confirmationUrl;
      } else {
        // Сменить на Standard или Comfort
        await changeTariff(tariffKey as 'STANDARD' | 'COMFORT');
        await loadData();
        alert(`Тариф изменён на ${tariffs[tariffKey]?.name}`);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ошибка смены тарифа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Тарифы и подписка</h1>

        {/* Текущая подписка */}
        <div className="mb-8">
          <CurrentSubscription />
        </div>

        {/* Доступные тарифы */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Выберите тариф</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(tariffs).map(([key, tariff]) => (
              <TariffCard
                key={key}
                tariffKey={key}
                tariff={tariff}
                isActive={key === currentTariffType}
                onSelect={handleSelectTariff}
                loading={loading}
              />
            ))}
          </div>
        </div>

        {/* Информация */}
        <div className="mt-12 bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Как работают тарифы?</h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Стандарт</h4>
              <p className="text-gray-600">
                Бесплатный тариф. Оплата 150₽ за каждый отклик на заказ. Одна
                специализация.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Комфорт</h4>
              <p className="text-gray-600">
                Бесплатные отклики. Оплата 500₽ только если вас выбрали. Одна
                специализация.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Премиум</h4>
              <p className="text-gray-600">
                Подписка 5000₽ на 30 дней. Безлимитные отклики. До 3-х специализаций
                одновременно.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

