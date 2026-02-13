import { Router } from 'express';
import axios from 'axios';

const router = Router();

const YANDEX_API_KEY = process.env.YANDEX_MAPS_API_KEY || '58dcae52-7fa8-4802-a613-df0baddf9c66';

// Поиск адресов (автодополнение)
router.get('/suggest', async (req, res) => {
  try {
    const { text } = req.query;
    console.log('🔍 Geocoding suggest request:', text);
    
    if (!text || typeof text !== 'string') {
      console.log('❌ Text parameter missing or invalid');
      return res.status(400).json({ error: 'Text parameter is required' });
    }

    console.log('📡 Calling Yandex Geosuggest API...');
    const response = await axios.get('https://suggest-maps.yandex.ru/v1/suggest', {
      params: {
        apikey: YANDEX_API_KEY,
        text: text,
        results: 5,
        types: 'house,street',
      },
    });

    console.log('✅ Yandex Geosuggest response:', response.data.results?.length || 0, 'results');
    res.json(response.data);
  } catch (error: any) {
    console.error('❌ Geocoding suggest error:', error.message);
    res.status(500).json({ error: 'Failed to fetch address suggestions' });
  }
});

// Получение координат по адресу
router.get('/geocode', async (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Address parameter is required' });
    }

    const response = await axios.get('https://geocode-maps.yandex.ru/1.x/', {
      params: {
        apikey: YANDEX_API_KEY,
        geocode: address,
        format: 'json',
        results: 1,
      },
    });

    res.json(response.data);
  } catch (error: any) {
    console.error('❌ Geocoding error:', error.message);
    res.status(500).json({ error: 'Failed to geocode address' });
  }
});

export default router;

