'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createTopUpPayment } from '@/lib/api/payments';

const PRESET_AMOUNTS = [500, 1000, 2000, 5000, 10000];

export default function TopUpForm() {
  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTopUp = async () => {
    try {
      setLoading(true);
      setError(null);

      const finalAmount = customAmount ? parseFloat(customAmount) : amount;

      if (finalAmount < 100) {
        setError('Минимальная сумма пополнения - 100₽');
        return;
      }

      const { confirmationUrl } = await createTopUpPayment(finalAmount);

      // Перенаправить на страницу оплаты
      window.location.href = confirmationUrl;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка создания платежа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Пополнение баланса</CardTitle>
        <CardDescription>Выберите сумму или введите свою</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Пресеты */}
        <div>
          <Label>Быстрый выбор суммы</Label>
          <div className="grid grid-cols-5 gap-2 mt-2">
            {PRESET_AMOUNTS.map((preset) => (
              <Button
                key={preset}
                type="button"
                variant={amount === preset && !customAmount ? 'default' : 'outline'}
                onClick={() => {
                  setAmount(preset);
                  setCustomAmount('');
                }}
              >
                {preset}₽
              </Button>
            ))}
          </div>
        </div>

        {/* Своя сумма */}
        <div>
          <Label htmlFor="customAmount">Или введите свою сумму</Label>
          <Input
            id="customAmount"
            type="number"
            placeholder="Минимум 100₽"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setAmount(0);
            }}
            min={100}
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
            {error}
          </div>
        )}

        {/* Итого */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>К оплате:</span>
            <span>{customAmount || amount}₽</span>
          </div>
        </div>

        <Button
          onClick={handleTopUp}
          disabled={loading || (!amount && !customAmount)}
          className="w-full"
          size="lg"
        >
          {loading ? 'Создание платежа...' : 'Перейти к оплате'}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Оплата через ЮKassa. Поддерживаются банковские карты и другие способы оплаты.
        </p>
      </CardContent>
    </Card>
  );
}

