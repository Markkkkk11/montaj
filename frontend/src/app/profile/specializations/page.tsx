'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/layout/Header';
import { SPECIALIZATION_LABELS } from '@/lib/utils';
import { Specialization } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { CheckCircle, AlertCircle, Save } from 'lucide-react';

export default function SpecializationsPage() {
  const { user, getCurrentUser, isHydrated } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const [selected, setSelected] = useState<Specialization[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [maxSpecializations, setMaxSpecializations] = useState(3);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'EXECUTOR') { router.push('/'); return; }
    if (user.executorProfile) setSelected(user.executorProfile.specializations);
    if (user.subscription) setMaxSpecializations(user.subscription.specializationCount || 3);
  }, [user, router, isHydrated]);

  const handleToggle = (spec: Specialization) => {
    if (selected.includes(spec)) {
      setSelected(selected.filter(s => s !== spec));
    } else {
      if (selected.length >= maxSpecializations) {
        toast({ variant: 'destructive', title: '❌ Лимит превышен', description: `Максимум ${maxSpecializations} специализаций.` });
        return;
      }
      setSelected([...selected, spec]);
    }
  };

  const handleSave = async () => {
    if (selected.length === 0) {
      toast({ variant: 'destructive', title: '❌ Ошибка', description: 'Выберите хотя бы одну специализацию' });
      return;
    }
    try {
      setIsSaving(true);
      await api.put('/users/executor-profile', { specializations: selected });
      toast({ variant: 'success', title: '✅ Специализации обновлены!' });
      await getCurrentUser();
      setTimeout(() => router.push('/orders'), 1500);
    } catch (error: any) {
      toast({ variant: 'destructive', title: '❌ Ошибка', description: error.response?.data?.error || 'Не удалось сохранить' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user || user.role !== 'EXECUTOR') return null;

  const tariffName = user.subscription?.tariffType === 'STANDARD' ? 'Стандарт' :
                     user.subscription?.tariffType === 'COMFORT' ? 'Комфорт' : 'Премиум';

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header showBack />

      <main className="container mx-auto px-4 py-8 max-w-3xl page-enter">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl font-extrabold">Специализации</CardTitle>
            <CardDescription>Выберите категории заказов, которые вы хотите видеть</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-100">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-blue-900 text-sm">Ваш тариф: {tariffName}</p>
                  <p className="text-sm text-blue-700 mt-1">Доступно: {maxSpecializations} специализаций</p>
                  {maxSpecializations === 1 && (
                    <p className="text-sm text-blue-700 mt-2">
                      💡 Хотите больше?{' '}
                      <Button variant="link" className="p-0 h-auto ml-1 text-blue-600" onClick={() => router.push('/executor/tariffs')}>
                        Перейти на Премиум →
                      </Button>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm mb-3 block font-bold">
                Выбрано: <span className="text-primary">{selected.length}</span> из {maxSpecializations}
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Object.entries(SPECIALIZATION_LABELS).map(([key, label]) => {
                  const spec = key as Specialization;
                  const isSelected = selected.includes(spec);
                  const isDisabled = !isSelected && selected.length >= maxSpecializations;

                  return (
                    <button
                      key={key}
                      onClick={() => !isDisabled && handleToggle(spec)}
                      disabled={isDisabled}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        isSelected
                          ? 'border-primary bg-blue-50/80 shadow-soft'
                          : isDisabled
                            ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-40'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold text-sm ${isSelected ? 'text-primary' : 'text-gray-700'}`}>{label}</span>
                        {isSelected && <CheckCircle className="h-5 w-5 text-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={isSaving || selected.length === 0} className="flex-1 gap-2">
                <Save className="h-4 w-4" /> {isSaving ? 'Сохранение...' : 'Сохранить специализации'}
              </Button>
              <Button variant="outline" onClick={() => router.back()} disabled={isSaving}>Отмена</Button>
            </div>

            {selected.length === 0 && (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3">
                ⚠️ Выберите хотя бы одну специализацию, чтобы видеть заказы
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
