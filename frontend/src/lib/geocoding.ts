/**
 * Геокодирование адреса с использованием Яндекс.Карт JavaScript API
 */

// Глобальная переменная ymaps будет доступна после загрузки скрипта
declare global {
  interface Window {
    ymaps: any;
  }
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
}

export interface AddressSuggestion {
  displayName: string;
  address: string;
  latitude: number;
  longitude: number;
}

export async function geocodeAddress(
  region: string,
  address: string
): Promise<GeocodingResult | null> {
  try {
    // Ждем загрузки ymaps
    if (typeof window === 'undefined' || !window.ymaps) {
      console.error('❌ Yandex Maps API не загружен');
      return null;
    }

    const query = `${address}, ${region}, Россия`;
    console.log('🔍 Геокодирование (Yandex Maps JS):', query);

    // Используем ymaps.geocode
    const result = await window.ymaps.geocode(query, {
      results: 1,
    });

    const firstGeoObject = result.geoObjects.get(0);
    
    if (firstGeoObject) {
      const coords = firstGeoObject.geometry.getCoordinates();
      return {
        latitude: coords[0],
        longitude: coords[1],
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Координаты городов России по умолчанию
 */
export const DEFAULT_CITY_COORDS: Record<string, GeocodingResult> = {
  'Москва': { latitude: 55.7558, longitude: 37.6173 },
  'Санкт-Петербург': { latitude: 59.9343, longitude: 30.3351 },
  'Новосибирск': { latitude: 55.0084, longitude: 82.9357 },
  'Екатеринбург': { latitude: 56.8389, longitude: 60.6057 },
  'Казань': { latitude: 55.8304, longitude: 49.0661 },
  'Нижний Новгород': { latitude: 56.2965, longitude: 43.9361 },
  'Челябинск': { latitude: 55.1644, longitude: 61.4368 },
  'Самара': { latitude: 53.1959, longitude: 50.1002 },
  'Омск': { latitude: 54.9885, longitude: 73.3242 },
  'Ростов-на-Дону': { latitude: 47.2357, longitude: 39.7015 },
};

/**
 * Получить координаты города или попытаться геокодировать
 */
export async function getCoordinates(
  region: string,
  address?: string
): Promise<GeocodingResult | null> {
  // Сначала пробуем точный адрес
  if (address) {
    const coords = await geocodeAddress(region, address);
    if (coords) return coords;
  }

  // Если не получилось, возвращаем координаты города
  return DEFAULT_CITY_COORDS[region] || null;
}

/**
 * Поиск адресов с автодополнением (используем геокодер для поиска)
 */
export async function searchAddresses(
  region: string,
  query: string
): Promise<AddressSuggestion[]> {
  if (!query || query.length < 3) {
    console.log('🔍 Поиск адресов: запрос слишком короткий', query);
    return [];
  }

  try {
    // Ждем загрузки ymaps
    if (typeof window === 'undefined' || !window.ymaps) {
      console.error('❌ Yandex Maps API не загружен');
      return [];
    }

    const searchQuery = `${region}, ${query}`;
    console.log('🔍 Поиск адресов (Yandex Geocoder):', searchQuery);

    // Используем ymaps.geocode для поиска (возвращает до 10 результатов)
    const result = await window.ymaps.geocode(searchQuery, {
      results: 5,
    });

    const geoObjects = result.geoObjects;
    const suggestions: AddressSuggestion[] = [];

    console.log('📦 Получено результатов:', geoObjects.getLength());

    for (let i = 0; i < geoObjects.getLength(); i++) {
      const geoObject = geoObjects.get(i);
      const coords = geoObject.geometry.getCoordinates();
      const address = geoObject.getAddressLine();
      const name = geoObject.properties.get('name') || address;

      suggestions.push({
        displayName: name,
        address: address,
        latitude: coords[0],
        longitude: coords[1],
      });
    }

    console.log('✅ Подсказки адресов:', suggestions);
    return suggestions;
  } catch (error) {
    console.error('❌ Address search error:', error);
    return [];
  }
}


/**
 * Проверить существование адреса
 */
export async function validateAddress(
  region: string,
  address: string
): Promise<{ valid: boolean; suggestions?: AddressSuggestion[] }> {
  const suggestions = await searchAddresses(region, address);
  
  if (suggestions.length === 0) {
    return { valid: false };
  }

  // Проверяем точное совпадение
  const exactMatch = suggestions.some(
    (s) => s.address.toLowerCase() === address.toLowerCase()
  );

  return {
    valid: exactMatch || suggestions.length > 0,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
  };
}

