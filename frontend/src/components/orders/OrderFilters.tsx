'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SPECIALIZATION_LABELS } from '@/lib/utils';
import { Specialization, OrderFilters as Filters } from '@/lib/types';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { SlidersHorizontal, RotateCcw, ChevronDown, Save, CheckCircle, Loader2 } from 'lucide-react';

const AVAILABLE_REGIONS = [
  'Москва и обл.',
  'Санкт-Петербург и обл.',
  'Краснодар',
];

interface OrderFiltersProps {
  onApply: (filters: Filters) => void;
  onSpecializationsSaved?: () => void;
  initialFilters?: Filters;
}

export function OrderFilters({ onApply, onSpecializationsSaved, initialFilters = {} }: OrderFiltersProps) {
  const { user, getCurrentUser } = useAuthStore();
  const { toast } = useToast();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [isOpen, setIsOpen] = useState(false);

  const [selectedSpecs, setSelectedSpecs] = useState<Specialization[]>([]);
  const [isSavingSpecs, setIsSavingSpecs] = useState(false);
  const [maxSpecializations, setMaxSpecializations] = useState(3);

  useEffect(() => {
    if (user?.executorProfile) {
      setSelectedSpecs(user.executorProfile.specializations || []);
    }
    if (user?.subscription) {
      setMaxSpecializations(user.subscription.specializationCount || 3);
    }
  }, [user]);

  const handleToggleSpec = (spec: Specialization) => {
    if (selectedSpecs.includes(spec)) {
      setSelectedSpecs(selectedSpecs.filter(s => s !== spec));
    } else {
      if (selectedSpecs.length >= maxSpecializations) {
        toast({ variant: 'destructive', title: '❌ Лимит', description: `Максимум ${maxSpecializations} специализаций` });
        return;
      }
      setSelectedSpecs([...selectedSpecs, spec]);
    }
  };

  const specsChanged = (() => {
    const current = user?.executorProfile?.specializations || [];
    if (current.length !== selectedSpecs.length) return true;
    return !current.every(s => selectedSpecs.includes(s));
  })();

  const handleSaveSpecs = async () => {
    if (selectedSpecs.length === 0) {
      toast({ variant: 'destructive', title: '❌ Ошибка', description: 'Выберите хотя бы одну специализацию' });
      return;
    }
    try {
      setIsSavingSpecs(true);
      await api.put('/users/executor-profile', { specializations: selectedSpecs });
      toast({ variant: 'success', title: '✅ Специализации сохранены!' });
      await getCurrentUser();
      onSpecializationsSaved?.();
    } catch (error: any) {
      toast({ variant: 'destructive', title: '❌ Ошибка', description: error.response?.data?.error || 'Не удалось сохранить' });
    } finally {
      setIsSavingSpecs(false);
    }
  };

  const handleApply = () => {
    onApply(filters);
    setIsOpen(false);
  };

  const handleReset = () => {
    setFilters({});
    onApply({});
  };

  const isExecutor = user?.role === 'EXECUTOR';

  const selectClassName = "w-full mt-1 sm:mt-1.5 rounded-lg sm:rounded-xl border border-gray-200 bg-white px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all duration-200";

  const activeFiltersCount = [filters.category, filters.region, filters.sortBy !== 'createdAt' ? filters.sortBy : null, filters.sortOrder !== 'desc' ? filters.sortOrder : null].filter(Boolean).length;

  return (
    <Card className="lg:sticky lg:top-20 overflow-hidden w-full max-w-full box-border">
      <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6 cursor-pointer lg:cursor-default" onClick={() => setIsOpen(!isOpen)}>
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Фильтры
          {activeFiltersCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">{activeFiltersCount}</span>
          )}
          <ChevronDown className={`h-4 w-4 ml-auto text-gray-400 transition-transform duration-300 lg:hidden ${isOpen ? 'rotate-180' : ''}`} />
        </CardTitle>
      </CardHeader>
      <CardContent className={`space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6 ${isOpen ? 'block' : 'hidden'} lg:block`}>
        {!isExecutor && (
          <div>
            <Label htmlFor="category" className="text-[10px] sm:text-xs">Специализация</Label>
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

        {isExecutor && (
          <div>
            <Label className="text-[10px] sm:text-xs font-bold">
              Специализации: <span className="text-primary">{selectedSpecs.length}</span> из {maxSpecializations}
            </Label>
            <div className="grid grid-cols-1 gap-1.5 mt-1.5">
              {Object.entries(SPECIALIZATION_LABELS).map(([key, label]) => {
                const spec = key as Specialization;
                const isSelected = selectedSpecs.includes(spec);
                const isDisabled = !isSelected && selectedSpecs.length >= maxSpecializations;

                return (
                  <button
                    key={key}
                    onClick={() => !isDisabled && handleToggleSpec(spec)}
                    disabled={isDisabled}
                    className={`relative px-3 py-2 rounded-lg sm:rounded-xl border text-left transition-all duration-200 text-xs sm:text-sm ${
                      isSelected
                        ? 'border-primary bg-blue-50/80 shadow-sm'
                        : isDisabled
                          ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-40'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold ${isSelected ? 'text-primary' : 'text-gray-700'}`}>{label}</span>
                      {isSelected && <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
            {specsChanged && (
              <Button
                onClick={handleSaveSpecs}
                disabled={isSavingSpecs || selectedSpecs.length === 0}
                className="w-full mt-2 gap-2 text-xs sm:text-sm h-8 sm:h-9"
                size="sm"
              >
                {isSavingSpecs ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Сохранение...</>
                ) : (
                  <><Save className="h-3.5 w-3.5" /> Сохранить специализации</>
                )}
              </Button>
            )}
          </div>
        )}

        <div>
          <Label htmlFor="region" className="text-[10px] sm:text-xs">Регион</Label>
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

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-3">
          <div>
            <Label htmlFor="sortBy" className="text-[10px] sm:text-xs">Сортировка</Label>
            <select
              id="sortBy"
              className={selectClassName}
              value={filters.sortBy || 'createdAt'}
              onChange={(e) =>
                setFilters({ ...filters, sortBy: (e.target.value as 'createdAt' | 'startDate') || undefined })
              }
            >
              <option value="createdAt">По дате</option>
              <option value="startDate">По началу работ</option>
            </select>
          </div>

          <div>
            <Label htmlFor="sortOrder" className="text-[10px] sm:text-xs">Порядок</Label>
            <select
              id="sortOrder"
              className={selectClassName}
              value={filters.sortOrder || 'desc'}
              onChange={(e) =>
                setFilters({ ...filters, sortOrder: (e.target.value as 'asc' | 'desc') || undefined })
              }
            >
              <option value="desc">Новые ↓</option>
              <option value="asc">Старые ↑</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-1 sm:pt-3">
          <Button onClick={handleApply} className="flex-1 text-xs sm:text-sm h-8 sm:h-9" size="sm">
            Применить
          </Button>
          <Button onClick={handleReset} variant="outline" size="sm" className="gap-1 text-xs sm:text-sm h-8 sm:h-9">
            <RotateCcw className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Сброс
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
