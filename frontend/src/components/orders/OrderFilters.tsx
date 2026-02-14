'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SPECIALIZATION_LABELS } from '@/lib/utils';
import { Specialization, OrderFilters as Filters } from '@/lib/types';
import { useAuthStore } from '@/stores/authStore';

// Список доступных регионов (совпадает с координатами в OrdersMap)
const AVAILABLE_REGIONS = [
  'Москва',
  'Санкт-Петербург',
  'Новосибирск',
  'Екатеринбург',
  'Казань',
  'Нижний Новгород',
  'Челябинск',
  'Самара',
  'Омск',
  'Ростов-на-Дону',
  'Уфа',
  'Красноярск',
  'Воронеж',
  'Пермь',
  'Волгоград',
];

interface OrderFiltersProps {
  onApply: (filters: Filters) => void;
  initialFilters?: Filters;
}

export function OrderFilters({ onApply, initialFilters = {} }: OrderFiltersProps) {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState<Filters>(initialFilters);

  const handleApply = () => {
    onApply(filters);
  };

  const handleReset = () => {
    setFilters({});
    onApply({});
  };

  // Исполнитель видит заказы только по своим специализациям
  const isExecutor = user?.role === 'EXECUTOR';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Фильтры</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Фильтр категорий только для заказчиков и админов */}
        {!isExecutor && (
          <div>
            <Label htmlFor="category">Специализация</Label>
            <select
              id="category"
              className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={filters.category || ''}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value as Specialization || undefined })
              }
            >
              <option value="">Все</option>
              {Object.entries(SPECIALIZATION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Информация о специализациях для исполнителей */}
        {isExecutor && user.executorProfile && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">Ваши специализации:</p>
            {user.executorProfile.specializations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.executorProfile.specializations.map((spec) => (
                  <span
                    key={spec}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                  >
                    {SPECIALIZATION_LABELS[spec]}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-blue-700">Не указаны. Заполните профиль!</p>
            )}
            <Button
              variant="link"
              size="sm"
              className="mt-2 p-0 h-auto text-blue-600"
              onClick={() => window.location.href = '/profile/specializations'}
            >
              Изменить специализации →
            </Button>
          </div>
        )}

        <div>
          <Label htmlFor="region">Регион</Label>
          <select
            id="region"
            className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filters.region || ''}
            onChange={(e) => setFilters({ ...filters, region: e.target.value || undefined })}
          >
            <option value="">Все регионы</option>
            {AVAILABLE_REGIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Бюджет</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <Input
              placeholder="От"
              type="number"
              value={filters.minBudget || ''}
              onChange={(e) =>
                setFilters({ ...filters, minBudget: Number(e.target.value) || undefined })
              }
            />
            <Input
              placeholder="До"
              type="number"
              value={filters.maxBudget || ''}
              onChange={(e) =>
                setFilters({ ...filters, maxBudget: Number(e.target.value) || undefined })
              }
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={handleApply} className="flex-1">
            Применить
          </Button>
          <Button onClick={handleReset} variant="outline" className="flex-1">
            Сбросить
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

