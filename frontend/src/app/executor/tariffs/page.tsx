'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { Check, Crown, Zap, Shield } from 'lucide-react';

export default function TariffsPage() {
  const { user, isHydrated } = useAuthStore();
  const router = useRouter();
  const [selectedTariff, setSelectedTariff] = useState<string>('');

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'EXECUTOR') { router.push('/customer/dashboard'); return; }
    setSelectedTariff(user.subscription?.tariffType || 'STANDARD');
  }, [user, router, isHydrated]);

  if (!isHydrated || !user) return null;

  const tariffs = [
    {
      id: 'STANDARD',
      name: 'Стандарт',
      price: '150 ₽',
      period: 'за отклик',
      description: 'Оплата за каждый отклик на заказ',
      icon: Shield,
      features: [
        'Доступ к 1 специализации',
        'Переключение между специализациями',
        'Просмотр всех заказов',
        'Базовая статистика',
        '150 ₽ за каждый отклик',
      ],
      gradient: 'from-gray-50 to-gray-100/50',
      border: 'border-gray-200',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
    },
    {
      id: 'COMFORT',
      name: 'Комфорт',
      price: '500 ₽',
      period: 'за взятый заказ',
      description: 'Платите только когда заказчик выбрал вас',
      icon: Zap,
      features: [
        'Доступ к 1 специализации',
        'Оплата только за взятые заказы',
        'Возврат средств при отмене заказчиком',
        'Расширенная статистика',
        'Приоритет в списке откликов',
      ],
      gradient: 'from-blue-50 to-indigo-50',
      border: 'border-blue-200',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      id: 'PREMIUM',
      name: 'Премиум',
      price: '5000 ₽',
      period: 'за 30 дней',
      description: 'Максимум возможностей для профессионалов',
      icon: Crown,
      features: [
        'До 3 специализаций одновременно',
        'Безлимитные отклики',
        'Приоритетное размещение',
        'Детальная аналитика',
        'Персональный менеджер',
        'Возврат средств при отмене',
      ],
      gradient: 'from-amber-50 to-yellow-50',
      border: 'border-amber-300',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      recommended: true,
    },
  ];

  const handleSelectTariff = (tariffId: string) => {
    alert(`Смена тарифа на ${tariffId} будет доступна после интеграции с платежной системой`);
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header showBack />

      <main className="container mx-auto px-4 py-8 max-w-5xl page-enter">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">Выбор тарифа</h1>
          <p className="text-muted-foreground">Выберите подходящий тариф для работы на платформе</p>
        </div>

      {user.subscription && (
          <div className="mb-8">
            <Card className="bg-emerald-50/80 border-emerald-200">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Check className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-900">
                      Текущий тариф: {user.subscription.tariffType === 'STANDARD' ? 'Стандарт' : user.subscription.tariffType === 'COMFORT' ? 'Комфорт' : 'Премиум'}
                    </p>
                {user.subscription.expiresAt && (
                      <p className="text-sm text-emerald-700">до {new Date(user.subscription.expiresAt).toLocaleDateString('ru-RU')}</p>
                )}
                  </div>
                </div>
              </CardContent>
          </Card>
        </div>
      )}

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {tariffs.map((tariff) => {
            const Icon = tariff.icon;
            return (
            <Card
              key={tariff.id}
                className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg bg-gradient-to-br ${tariff.gradient} ${tariff.border} ${
                  selectedTariff === tariff.id ? 'ring-2 ring-primary shadow-soft-lg' : ''
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
                    <span className="text-3xl font-extrabold text-gray-900">{tariff.price}</span>
                    <span className="text-sm text-muted-foreground ml-2">{tariff.period}</span>
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
                {selectedTariff === tariff.id ? (
                    <Button className="w-full" disabled variant="outline">✓ Текущий тариф</Button>
                ) : (
                    <Button className="w-full" variant={tariff.recommended ? 'default' : 'outline'} onClick={() => handleSelectTariff(tariff.id)}>
                    Выбрать тариф
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
              { q: 'Как работает тариф "Стандарт"?', a: 'При тарифе "Стандарт" с вашего баланса списывается 150 ₽ за каждый отклик на заказ. Вы можете работать с одной специализацией, но можете переключаться между ними.' },
              { q: 'Как работает тариф "Комфорт"?', a: 'При тарифе "Комфорт" оплата в размере 500 ₽ списывается только когда заказчик выбирает вас исполнителем. Если заказчик отменяет заказ, средства возвращаются.' },
              { q: 'Что даёт тариф "Премиум"?', a: 'Тариф "Премиум" за 5000 ₽ в месяц даёт безлимитные отклики на заказы, возможность работать с 3 специализациями одновременно, приоритетное размещение в списке исполнителей и персонального менеджера.' },
              { q: 'Бонус при регистрации', a: 'Новые исполнители получают тариф "Премиум" на 1 месяц бесплатно. 1000 бонусных рублей начисляется только после первого пополнения баланса на сумму от 150 рублей в течение 30 дней после регистрации.' },
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
