import './globals.css';
import Header from '@/components/organisms/Header/Header';
import Footer from '@/components/organisms/Footer/Footer';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { CartProvider } from '@/context/CartContext';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ENTREGAS.com.bo - Tu librería',
  description: 'Todo para el nuevo año escolar en un solo lugar',
  openGraph: {
    title: 'ENTREGAS.com.bo - Tu librería escolar',
    description: 'Encuentra los textos escolares, material educativo y plan lector al mejor precio con envíos a toda Bolivia.',
    url: 'https://entregas.com.bo',
    siteName: 'ENTREGAS.com.bo',
    images: [
      {
        url: 'https://entregas.com.bo/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ENTREGAS.com.bo',
      },
    ],
    locale: 'es_BO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ENTREGAS.com.bo - Tu librería escolar',
    description: 'Textos, útiles y plan lector. Todo para el año escolar en un solo lugar.',
    images: ['https://entregas.com.bo/og-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <CartProvider>
          <FavoritesProvider>
            <Header />
            {children}
            <Footer />
          </FavoritesProvider>
        </CartProvider>
      </body>
    </html>
  );
}
