import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SVMontaj - Платформа заказа монтажных услуг',
    short_name: 'SVMontaj',
    description: 'Платформа для поиска и заказа специалистов по монтажным работам',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#007bff',
    icons: [
      {
        src: '/logo.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: '/logo.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
  };
}

