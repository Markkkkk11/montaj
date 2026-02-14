'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { SPECIALIZATION_LABELS } from '@/lib/utils';
import { Specialization } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function SpecializationsPage() {
  const { user, getCurrentUser } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const [selected, setSelected] = useState<Specialization[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [maxSpecializations, setMaxSpecializations] = useState(3);
  const [lastChanged, setLastChanged] = useState<Date | null>(null);
  const [canChange, setCanChange] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'EXECUTOR') {
      router.push('/');
      return;
    }

    // Загрузить текущие специализации
    if (user.executorProfile) {
      setSelected(user.executorProfile.specializations);
    }

    // Получить лимит специализаций из тарифа
    if (user.subscription) {
      setMaxSpecializations(user.subscription.specializationCount || 3);
    }

    // Проверить, когда в последний раз менялись специализации
    // TODO: добавить поле lastSpecializationsUpdate в модель ExecutorProfile
    // Пока разрешаем менять всегда
    setCanChange(true);
  }, [user, router]);

  const handleToggle = (spec: Specialization) => {
    if (selected.includes(spec)) {
      // Убрать специализацию
      setSelected(selected.filter(s => s !== spec));
    } else {
      // Добавить специализацию, если не превышен лимит
      if (selected.length >= maxSpecializations) {
        toast({
          variant: 'destructive',
          title: '❌ Лимит превышен',
          description: `Ваш тариф позволяет выбрать максимум ${maxSpecializations} специализаций${maxSpecializations === 1 ? 'ю' : 'и'}.`,
        });
        return;
      }
      setSelected([...selected, spec]);
    }
  };

  const handleSave = async () => {
    if (selected.length === 0) {
      toast({
        variant: 'destructive',
        title: '❌ Ошибка',
        description: 'Выберите хотя бы одну специализацию',
      });
      return;
    }

    if (selected.length > maxSpecializations) {
      toast({
        variant: 'destructive',
        title: '❌ Ошибка',
        description: `Максимум ${maxSpecializations} специализаций${maxSpecializations === 1 ? 'ия' : 'и'} для вашего тарифа`,
      });
      return;
    }

    try {
      setIsSaving(true);

      await api.put('/users/executor-profile', {
        specializations: selected,
      });

      toast({
        variant: 'success',
        title: '✅ Специализации обновлены!',
        description: 'Теперь вы будете видеть заказы по выбранным категориям.',
      });

      // Обновить данные пользователя
      await getCurrentUser();

      // Перенаправить через секунду
      setTimeout(() => {
        router.push('/executor/dashboard');
      }, 1500);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '❌ Ошибка',
        description: error.response?.data?.error || 'Не удалось сохранить специализации',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user || user.role !== 'EXECUTOR') {
    return null;
  }

  const tariffName = user.subscription?.tariffType === 'STANDARD' ? 'Стандарт' :
                     user.subscription?.tariffType === 'COMFORT' ? 'Комфорт' : 'Премиум';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          ← Назад
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Специализации</CardTitle>
            <CardDescription>
              Выберите категории заказов, которые вы хотите видеть
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Информация о тарифе */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Ваш тариф: {tariffName}</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Доступно: {maxSpecializations} специализаций{maxSpecializations === 1 ? 'я' : 'и'}
                  </p>
                  {maxSpecializations === 1 && (
                    <p className="text-sm text-blue-700 mt-2">
                      💡 Хотите больше специализаций? 
                      <Button 
                        variant="link" 
                        className="p-0 h-auto ml-1 text-blue-600"
                        onClick={() => router.push('/profile/subscription')}
                      >
                        Перейти на Премиум →
                      </Button>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Выбор специализаций */}
            <div>
              <Label className="text-base mb-3 block">
                Выбрано: {selected.length} из {maxSpecializations}
              </Label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(SPECIALIZATION_LABELS).map(([key, label]) => {
                  const spec = key as Specialization;
                  const isSelected = selected.includes(spec);
                  const isDisabled = !isSelected && selected.length >= maxSpecializations;

                  return (
                    <button
                      key={key}
                      onClick={() => !isDisabled && handleToggle(spec)}
                      disabled={isDisabled}
                      className={`
                        relative p-4 rounded-lg border-2 text-left transition-all
                        ${isSelected 
                          ? 'border-primary bg-primary/5 shadow-sm' 
                          : isDisabled
                            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                            : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${isSelected ? 'text-primary' : 'text-gray-700'}`}>
                          {label}
                        </span>
                        {isSelected && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleSave} 
                disabled={isSaving || selected.length === 0}
                className="flex-1"
              >
                {isSaving ? 'Сохранение...' : 'Сохранить специализации'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.back()}
                disabled={isSaving}
              >
                Отмена
              </Button>
            </div>

            {/* Подсказка */}
            {selected.length === 0 && (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded p-3">
                ⚠️ Выберите хотя бы одну специализацию, чтобы видеть заказы
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

