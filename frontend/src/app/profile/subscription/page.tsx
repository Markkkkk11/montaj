'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CurrentSubscription from '@/components/subscriptions/CurrentSubscription';
import TariffCard from '@/components/subscriptions/TariffCard';
import { useAuthStore } from '@/stores/authStore';
import {
  getTariffInfo,
  getCurrentTariff,
  changeTariff,
  TariffInfo,
  Tariff,
} from '@/lib/api/subscriptions';
import {
  createSubscriptionPaymentWithReturnPath,
  processPaymentSuccess,
} from '@/lib/api/payments';

export default function SubscriptionPage() {
  return (
    <Suspense fallback={null}>
      <SubscriptionContent />
    </Suspense>
  );
}

function SubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getCurrentUser } = useAuthStore();
  const [tariffs, setTariffs] = useState<Record<string, TariffInfo>>({});
  const [currentTariff, setCurrentTariff] = useState<Tariff | null>(null);
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
      setCurrentTariff(currentTariff);
      setCurrentTariffType(currentTariff.tariffType);
    } catch (error) {
      console.error('Failed to load tariffs:', error);
    }
  };

  const handlePaymentCallback = async (paymentId: string) => {
    try {
      const payment = await processPaymentSuccess(paymentId);
      await loadData();
      await getCurrentUser();
      if (payment?.paid) {
        alert('Подписка успешно активирована!');
      } else {
        alert('Платёж не завершён. Оплата не была произведена.');
      }
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

      if (tariffKey === 'COMFORT' || tariffKey === 'PREMIUM') {
        // Comfort и Premium — оплата через ЮKassa
        const { confirmationUrl } = await createSubscriptionPaymentWithReturnPath(
          tariffKey as 'COMFORT' | 'PREMIUM',
          '/profile/subscription'
        );
        window.location.href = confirmationUrl;
      } else {
        // Standard — бесплатная смена
        await changeTariff('STANDARD');
        await loadData();
        await getCurrentUser();
        alert(`Тариф изменён на ${tariffs[tariffKey]?.name}`);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ошибка смены тарифа');
    } finally {
      setLoading(false);
    }
  };

  const standardTariff = tariffs.STANDARD;
  const comfortTariff = tariffs.COMFORT;
  const premiumTariff = tariffs.PREMIUM;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Тарифы и подписка</h1>

        {/* Текущая подписка */}
        <div className="mb-8">
          <CurrentSubscription tariff={currentTariff} />
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
                {standardTariff
                  ? `Бесплатный тариф. Оплата ${standardTariff.responsePrice}₽ за каждый отклик на заказ. ${
                      standardTariff.specializationCount === 1
                        ? 'Одна специализация.'
                        : `До ${standardTariff.specializationCount} специализаций.`
                    }`
                  : 'Бесплатный тариф с оплатой за каждый отклик.'}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">
                Комфорт
                {comfortTariff ? ` — ${comfortTariff.price} ₽/мес` : ''}
              </h4>
              <p className="text-gray-600">
                {comfortTariff
                  ? `Подписка ${comfortTariff.price}₽/мес. Бесплатные отклики. ${comfortTariff.orderTakenPrice}₽ списывается при выборе заказчиком. ${
                      comfortTariff.specializationCount === 1
                        ? 'Одна специализация.'
                        : `До ${comfortTariff.specializationCount} специализаций.`
                    }`
                  : 'Подписка с бесплатными откликами и оплатой только при выборе заказчиком.'}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Премиум</h4>
              <p className="text-gray-600">
                {premiumTariff
                  ? `Подписка ${premiumTariff.price}₽ на ${premiumTariff.duration || 30} дней. Безлимитные отклики. До ${premiumTariff.specializationCount} специализаций одновременно.`
                  : 'Подписка с безлимитными откликами и расширенным лимитом специализаций.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
