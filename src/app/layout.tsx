import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: {
    default: 'LeadScrap | Plataforma de Automação WhatsApp e Extração de Leads do Google Maps',
    template: '%s | LeadScrap'
  },
  description: 'Automatize seu WhatsApp e extraia leads qualificados do Google Maps com a LeadScrap. Plataforma completa de captação e disparos inteligentes para escalar suas vendas.',
  keywords: ['automação whatsapp', 'extração leads google maps', 'captação leads', 'disparo mensagens', 'whatsapp marketing', 'leads qualificados', 'google maps scraper', 'automação vendas', 'crm whatsapp', 'ferramenta prospectar'],
  authors: [{ name: 'ViraWeb' }],
  creator: 'ViraWeb',
  publisher: 'ViraWeb',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  metadataBase: new URL('https://viraweb.online'),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://viraweb.online',
    title: 'LeadScrap | Plataforma de Automação WhatsApp e Extração de Leads do Google Maps',
    description: 'Automatize seu WhatsApp e extraia leads qualificados do Google Maps com a LeadScrap. Plataforma completa de captação e disparos inteligentes.',
    siteName: 'LeadScrap',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'LeadScrap - Automação WhatsApp e Extração de Leads',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LeadScrap | Plataforma de Automação WhatsApp e Extração de Leads do Google Maps',
    description: 'Automatize seu WhatsApp e extraia leads qualificados do Google Maps com a LeadScrap.',
    images: ['/logo.png'],
    creator: '@viraweb',
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'LeadScrap',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
    },
    description: 'Plataforma de automação WhatsApp e extração de leads do Google Maps. Automatize seu WhatsApp e extraia leads qualificados para escalar suas vendas.',
    url: 'https://viraweb.online',
    author: {
      '@type': 'Organization',
      name: 'ViraWeb',
      url: 'https://viraweb.online',
    },
    publisher: {
      '@type': 'Organization',
      name: 'ViraWeb',
      url: 'https://viraweb.online',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
    },
  };

  return (
    <html lang="pt-BR" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen tech-bg antialiased font-sans" suppressHydrationWarning>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
