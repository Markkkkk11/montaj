'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { searchAddresses, AddressSuggestion } from '@/lib/geocoding';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';

interface AddressAutocompleteProps {
  region: string;
  value: string;
  onChange: (value: string, coords?: { latitude: number; longitude: number }) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function AddressAutocomplete({
  region,
  value,
  onChange,
  placeholder = 'Введите адрес',
  required = false,
  error,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isAddressSelected, setIsAddressSelected] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isSelectingRef = useRef(false); // Флаг программного выбора

  // Закрываем список при клике вне компонента
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Поиск адресов с debounce
  useEffect(() => {
    if (!region) return;

    // Если адрес выбирается программно, не запускаем поиск
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);

    // Сбрасываем флаг выбора только при ручном вводе
    setIsAddressSelected(false);

    timeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchAddresses(region, value);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error('Error searching addresses:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 500); // Задержка 500ms

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, region]);

  const handleSelect = (suggestion: AddressSuggestion) => {
    console.log('📍 Выбран адрес из списка:', suggestion);
    
    // Устанавливаем флаг программного выбора
    isSelectingRef.current = true;
    setIsAddressSelected(true); // Помечаем, что адрес выбран из списка
    
    onChange(suggestion.address, {
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    });
    
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    
    console.log('✅ Координаты переданы:', suggestion.latitude, suggestion.longitude);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => {
            // При ручном вводе НЕ передаем координаты (они будут undefined)
            onChange(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className={`${error ? 'border-red-500' : ''} ${isAddressSelected && value ? 'border-green-500 bg-green-50' : ''}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isAddressSelected && value && (
            <span className="text-green-600 text-xs font-medium">✓</span>
          )}
          {isLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          )}
        </div>
      </div>

      {/* Список подсказок */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-100 flex items-start gap-2 ${
                index === selectedIndex ? 'bg-gray-100' : ''
              }`}
            >
              <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {suggestion.address}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {suggestion.displayName}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Сообщение об ошибке или предупреждение */}
      {error && (
        <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}

      {/* Предупреждение если адрес не найден */}
      {!isLoading && value.length >= 3 && suggestions.length === 0 && showSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-yellow-200 rounded-md shadow-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-800">
              <strong>Адрес не найден.</strong> Проверьте правильность написания или попробуйте
              ввести адрес по-другому (например: "улица Планерная 7").
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

