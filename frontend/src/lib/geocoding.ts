/**
 * Геокодирование адреса с использованием Nominatim (OpenStreetMap)
 */

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
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MontajApp/1.0',
      },
    });

    if (!response.ok) {
      console.error('Geocoding API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
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
 * Поиск адресов с автодополнением
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
    const searchQuery = `${query}, ${region}, Россия`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      searchQuery
    )}&limit=5&addressdetails=1`;

    console.log('🔍 Поиск адресов:', searchQuery);
    console.log('📡 URL:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MontajApp/1.0',
      },
    });

    console.log('📡 Статус ответа:', response.status);

    if (!response.ok) {
      console.error('❌ Address search API error:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    console.log('📦 Получено результатов:', data.length);
    console.log('📦 Данные:', data);

    const suggestions = data.map((item: any) => ({
      displayName: item.display_name,
      address: extractAddress(item),
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    }));

    console.log('✅ Подсказки адресов:', suggestions);
    return suggestions;
  } catch (error) {
    console.error('❌ Address search error:', error);
    return [];
  }
}

/**
 * Извлечь короткий адрес из полного
 */
function extractAddress(item: any): string {
  const addr = item.address;
  const parts = [];

  if (addr.road) parts.push(addr.road);
  if (addr.house_number) parts.push(`д. ${addr.house_number}`);
  if (addr.suburb) parts.push(addr.suburb);
  
  return parts.join(', ') || item.display_name.split(',')[0];
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

