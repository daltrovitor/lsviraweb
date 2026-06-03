import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: {
    default: 'LeadScrap | Plataforma SaaS de Disparo WhatsApp em Massa & Captura de Leads',
    template: '%s | LeadScrap'
  },
  description: 'Automatize disparos em massa no WhatsApp com a LeadScrap. Captura de leads, dashboard inteligente, métricas em tempo real. Solução SaaS completa para escalas de vendas.',
  keywords: [
    'disparo whatsapp',
    'automação whatsapp',
    'extração leads google maps',
    'captação leads',
    'disparos inteligentes',
    'whatsapp marketing',
    'leads qualificados',
    'google maps scraper',
    'automação vendas',
    'crm whatsapp',
    'ferramenta prospectar',
    'leadscrap',
    'saas',
    'api whatsapp'
  ],
  authors: [{ name: 'LeadScrap Team' }],
  creator: 'LeadScrap',
  publisher: 'LeadScrap',
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
  metadataBase: new URL('https://leadscrap.com'),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://leadscrap.com',
    title: 'LeadScrap | Plataforma SaaS de Disparo WhatsApp em Massa & Captura de Leads',
    description: 'Automatize disparos em massa no WhatsApp com a LeadScrap. Captura de leads, dashboard inteligente, métricas em tempo real.',
    siteName: 'LeadScrap',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LeadScrap - Plataforma de Disparo WhatsApp em Massa',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LeadScrap | Disparo WhatsApp em Massa',
    description: 'Automatize disparos em massa no WhatsApp com a LeadScrap. Dashboard, leads, métricas em tempo real.',
    images: ['/og-image.png'],
    creator: '@leadscrap',
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
    alternateName: 'Lead Scrap',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
    },
    description: 'Plataforma SaaS de disparo em massa no WhatsApp com captura de leads, dashboard inteligente e métricas em tempo real. Automatize seu marketing e escale suas vendas.',
    url: 'https://leadscrap.com',
    sameAs: [
      'https://github.com/leadscrap',
      'https://twitter.com/leadscrap',
      'https://linkedin.com/company/leadscrap'
    ],
    author: {
      '@type': 'Organization',
      name: 'LeadScrap',
      url: 'https://leadscrap.com',
      logo: 'https://leadscrap.com/logo.png',
      sameAs: [
        'https://github.com/leadscrap',
        'https://twitter.com/leadscrap'
      ]
    },
    publisher: {
      '@type': 'Organization',
      name: 'LeadScrap',
      url: 'https://leadscrap.com',
      logo: 'https://leadscrap.com/logo.png',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
    },
    featureList: [
      'Disparo em massa para WhatsApp',
      'Captura automática de leads',
      'Dashboard administrativo em tempo real',
      'Sistema de aprovação de usuários',
      'Integração com Google Maps',
      'API REST completa',
      'WebSocket para atualizações',
      'Autenticação segura'
    ]
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
