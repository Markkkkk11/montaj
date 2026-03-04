'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentTariff, Tariff } from '@/lib/api/subscriptions';
import { Calendar, CreditCard, Grid3x3 } from 'lucide-react';

export default function CurrentSubscription() {
  const [tariff, setTariff] = useState<Tariff | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTariff();
  }, []);

  const loadTariff = async () => {
    try {
      const data = await getCurrentTariff();
      setTariff(data);
    } catch (error) {
      console.error('Failed to load tariff:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Загрузка...</div>;
  }

  if (!tariff) {
    return null;
  }

  const tariffNames: Record<string, string> = {
    STANDARD: 'Стандарт',
    COMFORT: 'Комфорт',
    PREMIUM: 'Премиум',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Текущая подписка</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Тариф</p>
            <p className="text-2xl font-bold text-blue-600">
              {tariffNames[tariff.tariffType] || tariff.tariffType}
            </p>
          </div>
          <div
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              tariff.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {tariff.isActive ? 'Активна' : 'Не активна'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <Grid3x3 className="w-5 h-5 text-gray-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Специализаций</p>
              <p className="text-lg font-semibold">{tariff.specializationCount}</p>
            </div>
          </div>

          {tariff.expiresAt && tariff.tariffType !== 'STANDARD' && (
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Истекает</p>
                <p className="text-sm font-semibold">
                  {new Date(tariff.expiresAt).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>
          )}
        </div>

        {tariff.tariffType === 'PREMIUM' && tariff.isActive && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              🎉 У вас активна подписка Premium! Наслаждайтесь безлимитными откликами.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

