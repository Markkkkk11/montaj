'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { TariffInfo } from '@/lib/api/subscriptions';

interface TariffCardProps {
  tariffKey: string;
  tariff: TariffInfo;
  isActive: boolean;
  onSelect: (tariffKey: string) => void;
  loading?: boolean;
}

export default function TariffCard({
  tariffKey,
  tariff,
  isActive,
  onSelect,
  loading = false,
}: TariffCardProps) {
  const isPremium = tariffKey === 'PREMIUM';

  return (
    <Card
      className={`relative ${
        isActive ? 'border-2 border-blue-500 shadow-lg' : ''
      } ${isPremium ? 'border-yellow-400' : ''}`}
    >
      {isActive && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
          Текущий тариф
        </div>
      )}

      {isPremium && !isActive && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-medium">
          Рекомендуем
        </div>
      )}

      <CardHeader>
        <CardTitle className="text-2xl">{tariff.name}</CardTitle>
        <CardDescription>{tariff.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Цена */}
        <div className="text-center py-4">
          {tariff.price > 0 ? (
            <>
              <div className="text-4xl font-bold">{tariff.price.toLocaleString()}₽</div>
              <div className="text-gray-500 text-sm mt-1">на {tariff.duration} дней</div>
            </>
          ) : (
            <div className="text-4xl font-bold text-green-600">Бесплатно</div>
          )}
        </div>

        {/* Стоимость откликов */}
        <div className="bg-gray-50 p-3 rounded-lg space-y-1">
          {tariff.responsePrice > 0 && (
            <div className="text-sm">
              <span className="text-gray-600">Отклик:</span>{' '}
              <span className="font-medium">{tariff.responsePrice}₽</span>
            </div>
          )}
          {tariff.orderTakenPrice > 0 && (
            <div className="text-sm">
              <span className="text-gray-600">При выборе:</span>{' '}
              <span className="font-medium">{tariff.orderTakenPrice}₽</span>
            </div>
          )}
          {tariff.responsePrice === 0 && tariff.orderTakenPrice === 0 && (
            <div className="text-sm text-green-600 font-medium">
              Безлимитные отклики
            </div>
          )}
        </div>

        {/* Возможности */}
        <ul className="space-y-2">
          {tariff.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Кнопка выбора */}
        <Button
          onClick={() => onSelect(tariffKey)}
          disabled={isActive || loading}
          className="w-full"
          variant={isPremium ? 'default' : 'outline'}
          size="lg"
        >
          {isActive ? 'Активен' : loading ? 'Загрузка...' : 'Выбрать тариф'}
        </Button>
      </CardContent>
    </Card>
  );
}

