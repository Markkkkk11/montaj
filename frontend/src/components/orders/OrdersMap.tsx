'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Order } from '@/lib/types';
import { MapPin } from 'lucide-react';

// Fix для иконок Leaflet в Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface OrdersMapProps {
  orders: Order[];
  onOrderSelect: (orderId: string) => void;
}

export function OrdersMap({ orders, onOrderSelect }: OrdersMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Инициализируем карту только один раз
    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        attributionControl: false, // Отключаем атрибуцию полностью
      }).setView([55.7558, 37.6173], 10); // Москва по умолчанию

      // CartoDB Voyager - самый яркий и контрастный вариант
      // С CSS фильтрами станет еще ярче
      const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '',
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      mapRef.current = map;
    }

    // Очищаем все маркеры
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapRef.current?.removeLayer(layer);
      }
    });

    // Добавляем маркеры ТОЛЬКО для заказов с реальными координатами
    // Не показываем заказы без адреса или с дефолтными координатами центра города
    const markers: L.Marker[] = [];
    const ordersWithCoords = orders.filter(order => 
      order.latitude && 
      order.longitude &&
      // Проверяем, что это не дефолтные координаты центра Москвы
      !(order.latitude === 55.7558 && order.longitude === 37.6173)
    );

    ordersWithCoords.forEach((order) => {
      if (!order.latitude || !order.longitude) return;

      // Создаем кастомную иконку в зависимости от категории
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="relative">
            <div class="bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg border-2 border-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
      });

      const marker = L.marker([order.latitude, order.longitude], { icon: customIcon })
        .addTo(mapRef.current!)
        .bindPopup(`
          <div class="p-2 min-w-[200px]">
            <h3 class="font-bold text-sm mb-1">${order.title}</h3>
            <p class="text-xs text-gray-600 mb-1"><strong>Регион:</strong> ${order.region}</p>
            <p class="text-xs text-gray-600 mb-2"><strong>Адрес:</strong> ${order.address}</p>
            <p class="text-xs mb-2">${order.description.substring(0, 80)}${order.description.length > 80 ? '...' : ''}</p>
            <div class="flex justify-between items-center mt-2">
              <span class="text-sm font-bold text-primary">${parseFloat(order.budget.toString()).toLocaleString('ru-RU')} ₽</span>
              <button 
                class="text-xs bg-primary text-white px-3 py-1 rounded hover:bg-primary/90"
                onclick="window.dispatchEvent(new CustomEvent('order-select', { detail: '${order.id}' }))"
              >
                Подробнее
              </button>
            </div>
          </div>
        `);

      markers.push(marker);
    });

    // Если есть маркеры, подстраиваем карту под них
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      mapRef.current.fitBounds(group.getBounds(), { padding: [50, 50] });
    }

    // Обработчик клика по кнопке "Подробнее"
    const handleOrderSelect = (event: Event) => {
      const customEvent = event as CustomEvent;
      onOrderSelect(customEvent.detail);
    };

    window.addEventListener('order-select', handleOrderSelect);

    return () => {
      window.removeEventListener('order-select', handleOrderSelect);
    };
  }, [orders, onOrderSelect]);

  // Cleanup при размонтировании
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full rounded-lg shadow-lg" style={{ minHeight: '600px' }} />
      
      {orders.filter(o => o.latitude && o.longitude).length === 0 && (
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

