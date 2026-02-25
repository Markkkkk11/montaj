'use client';

import { useEffect, useRef } from 'react';
import { Order } from '@/lib/types';
import { MapPin } from 'lucide-react';

interface OrdersMapProps {
  orders: Order[];
  region?: string;
  onOrderSelect: (orderId: string) => void;
}

// Типы для Яндекс.Карт API
declare global {
  interface Window {
    ymaps: any;
  }
}

// Координаты и зум для регионов
const REGION_CONFIG: Record<string, { center: [number, number]; zoom: number }> = {
  'Москва и обл.': { center: [55.7558, 37.6173], zoom: 9 },
  'Санкт-Петербург и обл.': { center: [59.9343, 30.3351], zoom: 9 },
  'Краснодар': { center: [45.0355, 38.9753], zoom: 11 },
};

// Настройки по умолчанию (Все регионы) — такой же масштаб как Москва и обл.
const DEFAULT_CENTER: [number, number] = [55.7558, 37.6173];
const DEFAULT_ZOOM = 9;

// Цвета маркеров по категориям
const CATEGORY_COLORS: Record<string, string> = {
  'WINDOWS': '#2563eb',      // Окна - синий
  'DOORS': '#9333ea',        // Двери - фиолетовый
  'CEILINGS': '#16a34a',     // Потолки - зелёный
  'BLINDS': '#dc2626',       // Рольставни - красный
  'CONDITIONERS': '#ea580c', // Кондиционеры - оранжевый
  'FURNITURE': '#6b7280',    // Мебель - серый
};

export function OrdersMap({ orders, region, onOrderSelect }: OrdersMapProps) {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // Проверяем, не загружен ли уже скрипт Яндекс.Карт
    const existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]');
    
    if (!window.ymaps && !existingScript && !scriptLoaded.current) {
      // Загружаем Яндекс.Карты API только если его еще нет
      scriptLoaded.current = true;
      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY}&lang=ru_RU`;
      script.async = true;
      script.onload = () => {
        window.ymaps.ready(initMap);
      };
      document.head.appendChild(script);
    } else if (window.ymaps && !isInitialized.current) {
      // API уже загружен, просто инициализируем карту
      window.ymaps.ready(initMap);
    }

    function initMap() {
      if (!mapContainerRef.current) return;
      
      // Если карта уже инициализирована, удаляем её
      if (mapRef.current && isInitialized.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }

      // Определяем центр и зум карты на основе региона
      const config = region && REGION_CONFIG[region] 
        ? REGION_CONFIG[region] 
        : { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM };

      console.log('🗺️ Initializing map with center:', config.center, 'zoom:', config.zoom, 'for region:', region);

      // Создаем карту
      mapRef.current = new window.ymaps.Map(mapContainerRef.current, {
        center: config.center,
        zoom: config.zoom,
        controls: ['zoomControl', 'fullscreenControl'],
      });

      isInitialized.current = true;
      updateMarkers();
    }

    function updateMarkers() {
      if (!mapRef.current) return;

      // Очищаем все объекты с карты
      mapRef.current.geoObjects.removeAll();

      // Фильтруем заказы с реальными координатами
      const ordersWithCoords = orders.filter(order => 
        order.latitude && 
        order.longitude &&
        // Проверяем, что это не дефолтные координаты центра Москвы
        !(order.latitude === 55.7558 && order.longitude === 37.6173)
      );

      if (ordersWithCoords.length === 0) return;

      const bounds: number[][] = [];

      ordersWithCoords.forEach((order) => {
        if (!order.latitude || !order.longitude) return;

        // Определяем цвет маркера по категории
        let markerColor = CATEGORY_COLORS[order.category] || '#2563eb';
        
        // Если заказ просмотрен - делаем цвет бледнее (добавляем прозрачность)
        if (order.hasViewed) {
          // Преобразуем hex в rgba с opacity 0.4
          const hex = markerColor.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          markerColor = `rgba(${r}, ${g}, ${b}, 0.4)`;
        }

        // Создаем метку
        const placemark = new window.ymaps.Placemark(
          [order.latitude, order.longitude],
          {
            balloonContentHeader: `<strong>${order.title}</strong>`,
            balloonContentBody: `
              <div style="max-width: 300px;">
                <p style="margin: 8px 0;"><strong>Регион:</strong> ${order.region}</p>
                <p style="margin: 8px 0;"><strong>Адрес:</strong> ${order.address}</p>
                <p style="margin: 8px 0;">${order.description.substring(0, 100)}${order.description.length > 100 ? '...' : ''}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
                  <span style="font-weight: bold; color: ${CATEGORY_COLORS[order.category] || '#2563eb'}; font-size: 16px;">${parseFloat(order.budget.toString()).toLocaleString('ru-RU')} ₽</span>
                  <button 
                    id="order-details-${order.id}"
                    style="background: ${CATEGORY_COLORS[order.category] || '#2563eb'}; color: white; padding: 6px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;"
                  >
                    Подробнее
                  </button>
                </div>
              </div>
            `,
            hintContent: order.title,
          },
          {
            preset: 'islands#blueDotIcon',
            iconColor: markerColor,
          }
        );

        // Обработчик клика на кнопку "Подробнее"
        placemark.events.add('balloonopen', () => {
          setTimeout(() => {
            const button = document.getElementById(`order-details-${order.id}`);
            if (button) {
              button.addEventListener('click', () => {
                onOrderSelect(order.id);
                mapRef.current.balloon.close();
              });
            }
          }, 100);
        });

        mapRef.current.geoObjects.add(placemark);
        bounds.push([order.latitude, order.longitude]);
      });

      // Устанавливаем центр и зум в соответствии с выбранным регионом
      const currentConfig = region && REGION_CONFIG[region]
        ? REGION_CONFIG[region]
        : { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM };

      if (mapRef.current && mapRef.current.setCenter) {
        try {
          mapRef.current.setCenter(currentConfig.center, currentConfig.zoom, {
            duration: 300,
          });
        } catch (error) {
          console.error('❌ Ошибка при установке центра карты:', error);
        }
      }
    }

    // Обновляем метки при изменении заказов
    if (isInitialized.current && window.ymaps) {
      updateMarkers();
    }

    return () => {
      // Cleanup при размонтировании компонента
      // НЕ удаляем карту при изменении региона
    };
  }, [orders, region, onOrderSelect]);


  const ordersWithCoords = orders.filter(order => 
    order.latitude && 
    order.longitude &&
    !(order.latitude === 55.7558 && order.longitude === 37.6173)
  );

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapContainerRef} 
        className="w-full h-full rounded-lg shadow-lg" 
        style={{ minHeight: '600px' }} 
      />
      
      {ordersWithCoords.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-lg">
          <div className="text-center">
            <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-muted-foreground">Нет заказов с указанными координатами</p>
          </div>
        </div>
      )}
    </div>
  );
}
