/**
 * Геокодирование адреса с использованием Яндекс.Карт API
 */

const YANDEX_API_KEY = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '';

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
    const query = `${address}, ${region}, Россия`;
    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_API_KEY}&geocode=${encodeURIComponent(
      query
    )}&format=json&results=1`;

    console.log('🔍 Геокодирование:', query);

    const response = await fetch(url);

    if (!response.ok) {
      console.error('Geocoding API error:', response.status);
      return null;
    }

    const data = await response.json();
    const geoObject = data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;

    if (geoObject) {
      const coords = geoObject.Point.pos.split(' ');
      return {
        latitude: parseFloat(coords[1]),
        longitude: parseFloat(coords[0]),
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
 * Поиск адресов с автодополнением (Яндекс.Геосаджест)
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
    const searchQuery = `${region}, ${query}`;
    const url = `https://suggest-maps.yandex.ru/v1/suggest?apikey=${YANDEX_API_KEY}&text=${encodeURIComponent(
      searchQuery
    )}&results=5&types=house,street`;

    console.log('🔍 Поиск адресов (Яндекс.Геосаджест):', searchQuery);

    const response = await fetch(url);

    console.log('📡 Статус ответа:', response.status);

    if (!response.ok) {
      console.error('❌ Address search API error:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    console.log('📦 Получено результатов:', data.results?.length || 0);

    if (!data.results || data.results.length === 0) {
      return [];
    }

    // Геокодируем каждый результат для получения координат
    const suggestions = await Promise.all(
      data.results.map(async (item: any) => {
        const coords = await geocodeAddress(region, item.title.text);
        return {
          displayName: item.title.text,
          address: item.subtitle?.text || item.title.text,
          latitude: coords?.latitude || 0,
          longitude: coords?.longitude || 0,
        };
      })
    );

    console.log('✅ Подсказки адресов:', suggestions);
    return suggestions.filter(s => s.latitude !== 0 && s.longitude !== 0);
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

