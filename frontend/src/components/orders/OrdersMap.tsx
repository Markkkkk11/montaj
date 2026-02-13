'use client';

import { useEffect, useRef } from 'react';
import { Order } from '@/lib/types';
import { MapPin } from 'lucide-react';

interface OrdersMapProps {
  orders: Order[];
  onOrderSelect: (orderId: string) => void;
}

// Типы для Яндекс.Карт API
declare global {
  interface Window {
    ymaps: any;
  }
}

export function OrdersMap({ orders, onOrderSelect }: OrdersMapProps) {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Загружаем Яндекс.Карты API
    if (!window.ymaps) {
      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY}&lang=ru_RU`;
      script.async = true;
      script.onload = () => {
        window.ymaps.ready(initMap);
      };
      document.head.appendChild(script);
    } else if (!isInitialized.current) {
      window.ymaps.ready(initMap);
    }

    function initMap() {
      if (!mapContainerRef.current || isInitialized.current) return;

      // Создаем карту
      mapRef.current = new window.ymaps.Map(mapContainerRef.current, {
        center: [55.7558, 37.6173], // Москва по умолчанию
        zoom: 10,
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
                  <span style="font-weight: bold; color: #2563eb; font-size: 16px;">${parseFloat(order.budget.toString()).toLocaleString('ru-RU')} ₽</span>
                  <button 
                    id="order-details-${order.id}"
                    style="background: #2563eb; color: white; padding: 6px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;"
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
            iconColor: '#2563eb',
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

      // Подстраиваем карту под все метки
      if (bounds.length > 0) {
        mapRef.current.setBounds(bounds, {
          checkZoomRange: true,
          zoomMargin: 50,
        });
      }
    }

    // Обновляем метки при изменении заказов
    if (isInitialized.current) {
      updateMarkers();
    }

    return () => {
      // Cleanup при размонтировании
      if (mapRef.current && isInitialized.current) {
        mapRef.current.destroy();
        mapRef.current = null;
        isInitialized.current = false;
      }
    };
  }, [orders, onOrderSelect]);

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
