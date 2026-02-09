'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SPECIALIZATION_LABELS } from '@/lib/utils';
import { Specialization, OrderFilters as Filters } from '@/lib/types';

interface OrderFiltersProps {
  onApply: (filters: Filters) => void;
  initialFilters?: Filters;
}

export function OrderFilters({ onApply, initialFilters = {} }: OrderFiltersProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters);

  const handleApply = () => {
    onApply(filters);
  };

  const handleReset = () => {
    setFilters({});
    onApply({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Фильтры</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <div>
          <Label htmlFor="region">Регион</Label>
          <Input
            id="region"
            placeholder="Москва, Санкт-Петербург..."
            value={filters.region || ''}
            onChange={(e) => setFilters({ ...filters, region: e.target.value || undefined })}
          />
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

