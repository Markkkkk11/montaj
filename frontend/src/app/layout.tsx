import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
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
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
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
      <head>
        <Script id="yandex-metrika" strategy="beforeInteractive">
          {`
            (function(m,e,t,r,i,k,a){
              m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
            })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=107153178', 'ym');

            ym(107153178, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
          `}
        </Script>
      </head>
      <body className={`${inter.className} overflow-x-hidden`}>
        <noscript>
          <div>
            <img src="https://mc.yandex.ru/watch/107153178" style={{position: 'absolute', left: '-9999px'}} alt="" />
          </div>
        </noscript>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

