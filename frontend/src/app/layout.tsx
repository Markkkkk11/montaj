import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: {
    default: 'SVMontaj — Найти монтажника | Заявки на монтаж окон, дверей, потолков, кондиционеров',
    template: '%s | SVMontaj',
  },
  description:
    'SVMontaj.ru — сервис поиска монтажников и размещения заявок на монтажные работы. Монтажники окон, установщики дверей, монтаж потолков, сборка мебели, установка рольставней и жалюзи, монтаж кондиционеров. Работа для монтажника — заявки каждый день.',
  keywords: [
    'монтажники окон',
    'установщик дверей',
    'монтажник дверей',
    'монтажник потолков',
    'монтаж потолков',
    'сборщик мебели',
    'сборка мебели',
    'установка рольставней',
    'сборка рольставни',
    'установка жалюзи',
    'монтажник кондиционеров',
    'монтаж кондиционеров',
    'установка кондиционеров',
    'заявки на монтаж',
    'работа для монтажника',
    'найти монтажника',
    'заказать монтаж окон',
    'установка окон',
    'монтажные работы',
    'монтаж окон Москва',
    'монтаж дверей Москва',
    'SVMontaj',
  ],
  icons: {
    icon: '/logo.jpg',
    apple: '/logo.jpg',
  },
  metadataBase: new URL('https://svmontaj.ru'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'SVMontaj — Найти монтажника | Заявки на монтаж',
    description:
      'Сервис поиска монтажников и размещения заявок. Окна, двери, потолки, кондиционеры, рольставни, мебель. Работа для монтажника — заявки каждый день.',
    url: 'https://svmontaj.ru',
    siteName: 'SVMontaj',
    locale: 'ru_RU',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    yandex: '',  // TODO: добавить код верификации Яндекс.Вебмастер
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="overflow-x-hidden">
      <body className={`${inter.className} overflow-x-hidden`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

