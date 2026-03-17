'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Order } from '@/lib/types';
import { MapPin } from 'lucide-react';

interface OrdersMapProps {
  orders: Order[];
  region?: string;
  onOrderSelect: (orderId: string) => void;
}

declare global {
  interface Window {
    ymaps: any;
  }
}

const REGION_CONFIG: Record<string, { center: [number, number]; zoom: number }> = {
  'Москва и обл.': { center: [55.7558, 37.6173], zoom: 9 },
  'Санкт-Петербург и обл.': { center: [59.9343, 30.3351], zoom: 9 },
  'Краснодар': { center: [45.0355, 38.9753], zoom: 11 },
};

const DEFAULT_CENTER: [number, number] = [55.7558, 37.6173];
const DEFAULT_ZOOM = 9;

const CATEGORY_COLORS: Record<string, string> = {
  'WINDOWS': '#2563eb',
  'DOORS': '#9333ea',
  'CEILINGS': '#16a34a',
  'BLINDS': '#dc2626',
  'CONDITIONERS': '#ea580c',
  'FURNITURE': '#6b7280',
};

function getMarkerColor(category: string, hasViewed?: boolean): string {
  const color = CATEGORY_COLORS[category] || '#2563eb';
  if (!hasViewed) return color;
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0.4)`;
}

function filterOrdersWithCoords(orders: Order[]): Order[] {
  return orders.filter(order =>
    order.latitude &&
    order.longitude &&
    !(order.latitude === 55.7558 && order.longitude === 37.6173)
  );
}

let ymapsLoadPromise: Promise<void> | null = null;

function ensureYmapsLoaded(): Promise<void> {
  if (ymapsLoadPromise) return ymapsLoadPromise;

  ymapsLoadPromise = new Promise((resolve) => {
    if (window.ymaps) {
      window.ymaps.ready(resolve);
      return;
    }

    const existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]');
    if (existingScript) {
      const poll = setInterval(() => {
        if (window.ymaps) {
          clearInterval(poll);
          window.ymaps.ready(resolve);
        }
      }, 50);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY}&lang=ru_RU`;
    script.async = true;
    script.onload = () => window.ymaps.ready(resolve);
    document.head.appendChild(script);
  });

  return ymapsLoadPromise;
}

export function OrdersMap({ orders, region, onOrderSelect }: OrdersMapProps) {
  const mapRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  const onOrderSelectRef = useRef(onOrderSelect);
  onOrderSelectRef.current = onOrderSelect;

  const updateMarkers = useCallback(() => {
    if (!mapRef.current || !window.ymaps) return;

    if (clustererRef.current) {
      mapRef.current.geoObjects.remove(clustererRef.current);
      clustererRef.current = null;
    }

    const ordersWithCoords = filterOrdersWithCoords(orders);
    if (ordersWithCoords.length === 0) return;

    const clusterer = new window.ymaps.Clusterer({
      preset: 'islands#invertedVioletClusterIcons',
      groupByCoordinates: false,
      clusterDisableClickZoom: false,
      clusterHideIconOnBalloonOpen: false,
      geoObjectHideIconOnBalloonOpen: false,
      clusterBalloonContentLayout: 'cluster#balloonCarousel',
      clusterBalloonPanelMaxMapArea: 0,
      clusterBalloonContentLayoutWidth: 310,
      clusterBalloonContentLayoutHeight: 200,
    });

    const placemarks = ordersWithCoords.map((order) => {
      const markerColor = getMarkerColor(order.category, order.hasViewed);

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
                <span style="font-weight: bold; color: ${CATEGORY_COLORS[order.category] || '#2563eb'}; font-size: 16px;">${Math.round(Number(order.budget)).toLocaleString('ru-RU')} ₽</span>
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

      placemark.events.add('balloonopen', () => {
        setTimeout(() => {
          const button = document.getElementById(`order-details-${order.id}`);
          if (button) {
            button.addEventListener('click', () => {
              onOrderSelectRef.current(order.id);
              mapRef.current?.balloon?.close();
            });
          }
        }, 100);
      });

      return placemark;
    });

    clusterer.add(placemarks);
    mapRef.current.geoObjects.add(clusterer);
    clustererRef.current = clusterer;

    const currentConfig = region && REGION_CONFIG[region]
      ? REGION_CONFIG[region]
      : { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM };

    try {
      mapRef.current.setCenter(currentConfig.center, currentConfig.zoom, { duration: 300 });
    } catch (error) {
      console.error('Map setCenter error:', error);
    }
  }, [orders, region]);

  useEffect(() => {
    let cancelled = false;

    ensureYmapsLoaded().then(() => {
      if (cancelled || !mapContainerRef.current) return;

      if (!isInitialized.current) {
        if (mapRef.current) {
          mapRef.current.destroy();
          mapRef.current = null;
        }

        const config = region && REGION_CONFIG[region]
          ? REGION_CONFIG[region]
          : { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM };

        mapRef.current = new window.ymaps.Map(mapContainerRef.current, {
          center: config.center,
          zoom: config.zoom,
          controls: ['zoomControl', 'fullscreenControl'],
        });

        isInitialized.current = true;
      }

      updateMarkers();
    });

    return () => {
      cancelled = true;
    };
  }, [orders, region, updateMarkers]);

  const ordersWithCoords = filterOrdersWithCoords(orders);

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
