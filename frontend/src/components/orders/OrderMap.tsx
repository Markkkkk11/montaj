'use client';

import { useEffect, useRef, useState } from 'react';
import { Order } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';

interface OrderMapProps {
  orders: Order[];
  onOrderSelect?: (orderId: string) => void;
  center?: [number, number];
  zoom?: number;
}

declare global {
  interface Window {
    ymaps: any;
  }
}

export function OrderMap({ orders, onOrderSelect, center = [55.75, 37.57], zoom = 10 }: OrderMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Загрузить API Яндекс.Карт
    if (!window.ymaps) {
      const script = document.createElement('script');
      script.src = 'https://api-maps.yandex.ru/2.1/?apikey=YOUR_API_KEY&lang=ru_RU';
      script.async = true;
      script.onload = initMap;
      script.onerror = () => {
        setError('Ошибка загрузки Яндекс.Карт');
        setIsLoading(false);
      };
      document.body.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      if (map) {
        map.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (map && orders) {
      updateMarkers();
    }
  }, [map, orders]);

  const initMap = () => {
    if (!mapRef.current) return;

    window.ymaps.ready(() => {
      try {
        const newMap = new window.ymaps.Map(mapRef.current, {
          center: center,
          zoom: zoom,
          controls: ['zoomControl', 'searchControl', 'typeSelector', 'fullscreenControl'],
        });

        setMap(newMap);
        setIsLoading(false);
      } catch (err: any) {
        setError('Ошибка инициализации карты');
        setIsLoading(false);
      }
    });
  };

  const updateMarkers = () => {
    if (!map) return;

    // Удалить все старые метки
    map.geoObjects.removeAll();

    // Добавить метки для заказов с координатами
    orders.forEach((order) => {
      if (order.latitude && order.longitude) {
        const placemark = new window.ymaps.Placemark(
          [order.latitude, order.longitude],
          {
            balloonContentHeader: order.title,
            balloonContentBody: `
              <div style="max-width: 250px;">
                <p style="margin-bottom: 8px;">${order.description.substring(0, 100)}...</p>
                <p style="margin-bottom: 4px;"><strong>Бюджет:</strong> ${
                  order.budgetType === 'negotiable'
                    ? 'Договорная'
                    : `${parseFloat(order.budget).toLocaleString()} ₽`
                }</p>
                <p style="margin-bottom: 4px;"><strong>Адрес:</strong> ${order.address}</p>
                <p style="margin-bottom: 4px;"><strong>Начало:</strong> ${new Date(
                  order.startDate
                ).toLocaleDateString('ru-RU')}</p>
              </div>
            `,
            balloonContentFooter: `<a href="/orders/${order.id}" style="color: #0066cc;">Подробнее →</a>`,
            hintContent: order.title,
          },
          {
            preset: 'islands#blueWorkIcon',
          }
        );

        placemark.events.add('click', () => {
          if (onOrderSelect) {
            onOrderSelect(order.id);
          }
        });

        map.geoObjects.add(placemark);
      }
    });

    // Автоматически подстроить zoom под все метки
    if (orders.length > 0) {
      const coordinates = orders
        .filter(o => o.latitude && o.longitude)
        .map(o => [o.latitude!, o.longitude!]);

      if (coordinates.length > 0) {
        try {
          map.setBounds(map.geoObjects.getBounds(), {
            checkZoomRange: true,
            zoomMargin: 50,
          });
        } catch (e) {
          // Если не удалось установить границы, оставляем как есть
        }
      }
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Загрузка карты...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-red-600">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Для работы карты необходим API-ключ Яндекс.Карт
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '600px',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    />
  );
}

