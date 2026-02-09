'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ArrowLeft } from 'lucide-react';

export default function TariffsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [selectedTariff, setSelectedTariff] = useState<string>('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'EXECUTOR') {
      router.push('/customer/dashboard');
      return;
    }
    setSelectedTariff(user.subscription?.tariffType || 'STANDARD');
  }, [user, router]);

  if (!user) {
    return null;
  }

  const tariffs = [
    {
      id: 'STANDARD',
      name: 'Стандарт',
      price: '150 ₽',
      period: 'за отклик',
      description: 'Оплата за каждый отклик на заказ',
      features: [
        'Доступ к 1 специализации',
        'Переключение между специализациями',
        'Просмотр всех заказов',
        'Базовая статистика',
        '150 ₽ за каждый отклик',
      ],
      color: 'border-gray-200',
      bgColor: 'bg-white',
    },
    {
      id: 'COMFORT',
      name: 'Комфорт',
      price: '500 ₽',
      period: 'за взятый заказ',
      description: 'Платите только когда заказчик выбрал вас',
      features: [
        'Доступ к 1 специализации',
        'Оплата только за взятые заказы',
        'Возврат средств при отмене заказчиком',
        'Расширенная статистика',
        'Приоритет в списке откликов',
      ],
      color: 'border-blue-200',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'PREMIUM',
      name: 'Премиум',
      price: '5000 ₽',
      period: 'за 30 дней',
      description: 'Максимум возможностей для профессионалов',
      features: [
        'До 3 специализаций одновременно',
        'Безлимитные отклики',
        'Приоритетное размещение',
        'Детальная аналитика',
        'Персональный менеджер',
        'Возврат средств при отмене',
      ],
      color: 'border-yellow-400',
      bgColor: 'bg-yellow-50',
      recommended: true,
    },
  ];

  const handleSelectTariff = (tariffId: string) => {
    // TODO: Интеграция с API для смены тарифа
    alert(`Смена тарифа на ${tariffId} будет доступна после интеграции с платежной системой`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.back()} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <h1 className="text-3xl font-bold">Выбор тарифа</h1>
          <p className="text-muted-foreground mt-2">
            Выберите подходящий тариф для работы на платформе
          </p>
        </div>
      </header>

      {/* Current Subscription */}
      {user.subscription && (
        <div className="container mx-auto px-4 py-6">
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle>Текущий тариф</CardTitle>
              <CardDescription>
                {user.subscription.tariffType === 'STANDARD' && 'Стандарт'}
                {user.subscription.tariffType === 'COMFORT' && 'Комфорт'}
                {user.subscription.tariffType === 'PREMIUM' && 'Премиум'}
                {user.subscription.expiresAt && (
                  <span className="ml-2">
                    • Действует до{' '}
                    {new Date(user.subscription.expiresAt).toLocaleDateString('ru-RU')}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Tariffs Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {tariffs.map((tariff) => (
            <Card
              key={tariff.id}
              className={`relative ${tariff.color} ${tariff.bgColor} ${
                selectedTariff === tariff.id ? 'ring-2 ring-primary' : ''
              }`}
            >
              {tariff.recommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                    РЕКОМЕНДУЕМ
                  </span>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{tariff.name}</CardTitle>
                <CardDescription>{tariff.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{tariff.price}</span>
                  <span className="text-muted-foreground ml-2">{tariff.period}</span>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {tariff.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {selectedTariff === tariff.id ? (
                  <Button className="w-full" disabled>
                    Текущий тариф
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={tariff.recommended ? 'default' : 'outline'}
                    onClick={() => handleSelectTariff(tariff.id)}
                  >
                    Выбрать тариф
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Часто задаваемые вопросы</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Как работает тариф "Стандарт"?</h3>
              <p className="text-sm text-muted-foreground">
                При тарифе "Стандарт" с вашего баланса списывается 150 ₽ за каждый отклик на заказ.
                Вы можете работать с одной специализацией, но можете переключаться между ними.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Как работает тариф "Комфорт"?</h3>
              <p className="text-sm text-muted-foreground">
                При тарифе "Комфорт" оплата в размере 500 ₽ списывается только когда заказчик
                выбирает вас исполнителем. Если заказчик отменяет заказ, средства возвращаются.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Что даёт тариф "Премиум"?</h3>
              <p className="text-sm text-muted-foreground">
                Тариф "Премиум" за 5000 ₽ в месяц даёт безлимитные отклики на заказы, возможность
                работать с 3 специализациями одновременно, приоритетное размещение в списке
                исполнителей и персонального менеджера для решения вопросов.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Бонус при регистрации</h3>
              <p className="text-sm text-muted-foreground">
                Новые исполнители получают 1000 бонусных рублей и тариф "Премиум" на 1 месяц
                бесплатно. Стартовый рейтинг составляет 3.0/5.0.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

