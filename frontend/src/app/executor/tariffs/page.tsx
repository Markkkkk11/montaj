'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { Check, Crown, Zap, Shield, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  getTariffInfo,
  getCurrentTariff,
  changeTariff,
  paySubscriptionFromBalance,
  Tariff,
  TariffInfo,
} from '@/lib/api/subscriptions';
import {
  createSubscriptionPaymentWithReturnPath,
  processPaymentSuccess,
} from '@/lib/api/payments';

export default function TariffsPage() {
  return (
    <Suspense fallback={null}>
      <TariffsContent />
    </Suspense>
  );
}

function TariffsContent() {
  const { user, isHydrated, getCurrentUser } = useAuthStore();
  const { settings, fetchSettings } = useSettingsStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [currentTariff, setCurrentTariff] = useState<Tariff | null>(null);
  const [currentTariffType, setCurrentTariffType] = useState<string>('STANDARD');
  const [tariffInfo, setTariffInfo] = useState<Record<string, TariffInfo>>({});
  const [changingTariff, setChangingTariff] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'EXECUTOR') { router.push('/customer/dashboard'); return; }

    fetchSettings().catch((error) => console.error('Failed to load public settings:', error));
    loadTariffData();

    // Обработать callback после оплаты Premium
    const paymentId = searchParams?.get('payment_id');
    if (paymentId) {
      handlePaymentCallback(paymentId);
    }
  }, [user, router, isHydrated, searchParams]);

  const loadTariffData = async () => {
    try {
      const [tariffsData, currentTariff] = await Promise.all([
        getTariffInfo(),
        getCurrentTariff(),
      ]);
      setTariffInfo(tariffsData);
      setCurrentTariff(currentTariff);
      setCurrentTariffType(currentTariff.tariffType);
    } catch (error) {
      console.error('Failed to load tariffs:', error);
    } finally {
      setPageLoading(false);
    }
  };

  const handlePaymentCallback = async (paymentId: string) => {
    try {
      const payment = await processPaymentSuccess(paymentId);
      await loadTariffData();
      await getCurrentUser();

      if (payment?.paid) {
        toast({
          title: 'Подписка активирована!',
          description: 'Тариф успешно подключён на 30 дней.',
        });
      } else {
        toast({
          title: 'Платёж не завершён',
          description: 'Оплата не была произведена. Попробуйте ещё раз.',
          variant: 'destructive',
        });
      }
      router.replace('/executor/tariffs');
    } catch (error: any) {
      console.error('Payment processing error:', error);
      toast({
        title: 'Ошибка обработки платежа',
        description: error.response?.data?.error || 'Попробуйте позже',
        variant: 'destructive',
      });
      router.replace('/executor/tariffs');
    }
  };

  if (!isHydrated || !user) return null;

  const stdResponsePrice = tariffInfo.STANDARD?.responsePrice ?? 150;
  const comfortPrice = tariffInfo.COMFORT?.price ?? 500;
  const comfortOrderPrice = tariffInfo.COMFORT?.orderTakenPrice ?? 500;
  const premiumPrice = tariffInfo.PREMIUM?.price ?? 5000;
  const stdSpecs = tariffInfo.STANDARD?.specializationCount ?? 1;
  const comfortSpecs = tariffInfo.COMFORT?.specializationCount ?? 1;
  const premiumSpecs = tariffInfo.PREMIUM?.specializationCount ?? 3;
  const trialDays = parseInt(settings.trialDays || '7', 10);

  const tariffs = [
    {
      id: 'STANDARD',
      name: 'Стандарт',
      price: 'Бесплатно',
      period: '',
      description: 'Оплата за каждый отклик на заказ',
      icon: Shield,
      isPaid: false,
      features: [
        `${stdSpecs === 1 ? 'Доступ к 1 специализации' : `До ${stdSpecs} специализаций`}`,
        'Переключение между специализациями',
        'Просмотр всех заказов',
        `${stdResponsePrice} ₽ за каждый отклик`,
      ],
      gradient: 'from-gray-50 to-gray-100/50',
      border: 'border-gray-200',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
    },
    {
      id: 'COMFORT',
      name: 'Комфорт',
      price: `${comfortPrice.toLocaleString('ru-RU')} ₽`,
      period: 'в месяц',
      description: 'Бесплатные отклики, платите только за взятые заказы',
      icon: Zap,
      isPaid: true,
      features: [
        `${comfortSpecs === 1 ? 'Доступ к 1 специализации' : `До ${comfortSpecs} специализаций`}`,
        'Бесплатные отклики на заказы',
        `${comfortOrderPrice} ₽ при выборе заказчиком`,
        `Минимум ${comfortOrderPrice} ₽ на балансе для отклика`,
        'Переключение между специализациями',
      ],
      gradient: 'from-blue-50 to-indigo-50',
      border: 'border-blue-200',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      id: 'PREMIUM',
      name: 'Премиум',
      price: `${premiumPrice.toLocaleString('ru-RU')} ₽`,
      period: 'в месяц',
      description: 'Максимум возможностей для профессионалов',
      icon: Crown,
      isPaid: true,
      features: [
        `До ${premiumSpecs} специализаций одновременно`,
        'Безлимитные отклики',
        'Приоритетное размещение',
        'Детальная аналитика',
        'Персональный менеджер',
      ],
      gradient: 'from-amber-50 to-yellow-50',
      border: 'border-amber-300',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      recommended: true,
    },
  ];

  // Оплата через ЮKassa
  const handlePayViaYookassa = async (tariffId: string) => {
    if (tariffId === currentTariffType) return;
    try {
      setChangingTariff(tariffId);
      const { confirmationUrl } = await createSubscriptionPaymentWithReturnPath(
        tariffId as 'COMFORT' | 'PREMIUM',
        '/executor/tariffs'
      );
      if (confirmationUrl) {
        window.location.href = confirmationUrl;
      } else {
        toast({ title: 'Ошибка', description: 'Не удалось получить ссылку на оплату', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.response?.data?.error || error.message || 'Попробуйте позже', variant: 'destructive' });
    } finally {
      setChangingTariff(null);
    }
  };

  // Оплата с баланса
  const handlePayFromBalance = async (tariffId: string) => {
    if (tariffId === currentTariffType) return;
    try {
      setChangingTariff(tariffId);
      await paySubscriptionFromBalance(tariffId as 'COMFORT' | 'PREMIUM');
      await loadTariffData();
      await getCurrentUser();
      toast({
        title: 'Подписка активирована!',
        description: 'Тариф успешно подключён на 30 дней.',
      });
    } catch (error: any) {
      toast({ title: 'Ошибка оплаты', description: error.response?.data?.error || error.message || 'Попробуйте позже', variant: 'destructive' });
    } finally {
      setChangingTariff(null);
    }
  };

  // Бесплатная смена на Стандарт
  const handleSelectStandard = async () => {
    if (currentTariffType === 'STANDARD') return;
    try {
      setChangingTariff('STANDARD');
      await changeTariff('STANDARD');
      await loadTariffData();
      await getCurrentUser();
      toast({ title: 'Тариф изменён!', description: 'Вы перешли на тариф «Стандарт»' });
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setChangingTariff(null);
    }
  };

  // Общий баланс пользователя
  const userBalance = parseFloat(user.balance?.amount?.toString() || '0') +
                     parseFloat(user.balance?.bonusAmount?.toString() || '0');

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header showBack />

      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-5xl page-enter">
        <div className="text-center mb-6 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 mb-2">Выбор тарифа</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Выберите подходящий тариф для работы на платформе</p>
        </div>

      {currentTariff && (
          <div className="mb-8">
            <Card className="bg-emerald-50/80 border-emerald-200">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Check className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-900">
                      Текущий тариф: {currentTariffType === 'STANDARD' ? 'Стандарт' : currentTariffType === 'COMFORT' ? 'Комфорт' : 'Премиум'}
                    </p>
                {currentTariff.expiresAt && (currentTariffType === 'PREMIUM' || currentTariffType === 'COMFORT') && (
                      <p className="text-sm text-emerald-700">до {new Date(currentTariff.expiresAt).toLocaleDateString('ru-RU')}</p>
                )}
                  </div>
                </div>
              </CardContent>
          </Card>
        </div>
      )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
          {tariffs.map((tariff) => {
            const Icon = tariff.icon;
            const isCurrent = currentTariffType === tariff.id;
            const isChanging = changingTariff === tariff.id;
            return (
            <Card
              key={tariff.id}
                className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg bg-gradient-to-br ${tariff.gradient} ${tariff.border} ${
                  isCurrent ? 'ring-2 ring-primary shadow-soft-lg' : ''
              }`}
            >
              {tariff.recommended && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-400 text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-wider">
                    Рекомендуем
                </div>
              )}
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 ${tariff.iconBg} rounded-2xl flex items-center justify-center mb-3`}>
                    <Icon className={`h-6 w-6 ${tariff.iconColor}`} />
                  </div>
                  <CardTitle className="text-xl">{tariff.name}</CardTitle>
                <CardDescription>{tariff.description}</CardDescription>
                  <div className="mt-3">
                    <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">{tariff.price}</span>
                    <span className="text-xs sm:text-sm text-muted-foreground ml-2">{tariff.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                  <ul className="space-y-2.5 mb-6">
                  {tariff.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                    <Button className="w-full" disabled variant="outline">✓ Текущий тариф</Button>
                ) : tariff.isPaid ? (
                  <div className="space-y-2">
                    {/* Оплата с баланса */}
                    {userBalance >= (tariff.id === 'COMFORT' ? comfortPrice : premiumPrice) ? (
                      <Button
                        className="w-full"
                        variant="default"
                        onClick={() => handlePayFromBalance(tariff.id)}
                        disabled={isChanging || changingTariff !== null}
                      >
                        {isChanging && changingTariff === tariff.id ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> Оплата...
                          </span>
                        ) : (
                          'Оплатить с баланса'
                        )}
                      </Button>
                    ) : (
                      <Button className="w-full" variant="outline" disabled>
                        На балансе {Math.floor(userBalance)} ₽ — недостаточно
                      </Button>
                    )}
                    {/* Оплата через ЮKassa */}
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => handlePayViaYookassa(tariff.id)}
                      disabled={isChanging || changingTariff !== null}
                    >
                      {isChanging && changingTariff === tariff.id ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Переход к оплате...
                        </span>
                      ) : (
                        'Оплатить через ЮKassa'
                      )}
                    </Button>
                  </div>
                ) : (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={handleSelectStandard}
                      disabled={isChanging || changingTariff !== null}
                    >
                      {isChanging && changingTariff === 'STANDARD' ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Смена тарифа...
                        </span>
                      ) : (
                        'Выбрать тариф'
                      )}
                  </Button>
                )}
              </CardContent>
            </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Часто задаваемые вопросы</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { q: 'Как работает тариф «Стандарт»?', a: `Тариф «Стандарт» — бесплатный. С вашего баланса списывается ${stdResponsePrice} ₽ за каждый отклик на заказ. Вы можете работать с ${stdSpecs === 1 ? 'одной специализацией' : `${stdSpecs} специализациями`} и при необходимости менять их.` },
              { q: 'Как работает тариф «Комфорт»?', a: `Тариф «Комфорт» стоит ${comfortPrice.toLocaleString('ru-RU')} ₽/мес. Отклики бесплатны, но на балансе должно быть не менее ${comfortOrderPrice} ₽. Оплата ${comfortOrderPrice} ₽ списывается с баланса когда заказчик выбирает вас исполнителем. Баланс может уйти в минус, если вас выбрали по нескольким заказам. Доступно ${comfortSpecs === 1 ? '1 специализация' : `${comfortSpecs} специализации`}.` },
              { q: 'Что даёт тариф «Премиум»?', a: `Тариф «Премиум» за ${premiumPrice.toLocaleString('ru-RU')} ₽/мес даёт безлимитные отклики на заказы, возможность работать с ${premiumSpecs} специализациями одновременно, приоритетное размещение в списке исполнителей и персонального менеджера.` },
              { q: 'Бонус при регистрации', a: `Новые исполнители получают тариф «Премиум» на ${trialDays} ${trialDays === 1 ? 'день' : trialDays < 5 ? 'дня' : 'дней'} бесплатно. 1000 бонусных рублей начисляется только после первого пополнения баланса на сумму от 150 рублей в течение 30 дней после регистрации.` },
            ].map((item, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-bold text-sm mb-1.5">{item.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
            </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
