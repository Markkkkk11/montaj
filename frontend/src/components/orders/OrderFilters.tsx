'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SPECIALIZATION_LABELS } from '@/lib/utils';
import { Specialization, OrderFilters as Filters } from '@/lib/types';
import { useAuthStore } from '@/stores/authStore';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';

const AVAILABLE_REGIONS = [
  'Москва и обл.',
  'Санкт-Петербург и обл.',
  'Краснодар',
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

  const isExecutor = user?.role === 'EXECUTOR';

  const selectClassName = "w-full mt-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all duration-200";

  return (
    <Card className="sticky top-20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" /> Фильтры
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isExecutor && (
          <div>
            <Label htmlFor="category" className="text-xs">Специализация</Label>
            <select
              id="category"
              className={selectClassName}
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

        {isExecutor && user.executorProfile && (
          <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-100">
            <p className="text-xs font-bold text-blue-900 mb-2">Ваши специализации</p>
            {user.executorProfile.specializations.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {user.executorProfile.specializations.map((spec) => (
                  <span key={spec} className="badge-primary">
                    {SPECIALIZATION_LABELS[spec]}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-blue-700">Не указаны. Заполните профиль!</p>
            )}
            <Button
              variant="link"
              size="sm"
              className="mt-2 p-0 h-auto text-blue-600 text-xs"
              onClick={() => window.location.href = '/profile/specializations'}
            >
              Изменить →
            </Button>
          </div>
        )}

        <div>
          <Label htmlFor="region" className="text-xs">Регион</Label>
          <select
            id="region"
            className={selectClassName}
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
          <Label htmlFor="sortBy" className="text-xs">Сортировка</Label>
          <select
            id="sortBy"
            className={selectClassName}
            value={filters.sortBy || 'createdAt'}
            onChange={(e) =>
              setFilters({ ...filters, sortBy: (e.target.value as 'createdAt' | 'startDate') || undefined })
            }
          >
            <option value="createdAt">По дате размещения</option>
            <option value="startDate">По дате начала работ</option>
          </select>
        </div>

        <div>
          <Label htmlFor="sortOrder" className="text-xs">Порядок</Label>
          <select
            id="sortOrder"
            className={selectClassName}
            value={filters.sortOrder || 'desc'}
            onChange={(e) =>
              setFilters({ ...filters, sortOrder: (e.target.value as 'asc' | 'desc') || undefined })
            }
          >
            <option value="desc">Сначала новые</option>
            <option value="asc">Сначала старые</option>
          </select>
        </div>

        <div className="flex gap-2 pt-3">
          <Button onClick={handleApply} className="flex-1" size="sm">
            Применить
          </Button>
          <Button onClick={handleReset} variant="outline" size="sm" className="gap-1">
            <RotateCcw className="h-3.5 w-3.5" /> Сброс
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
