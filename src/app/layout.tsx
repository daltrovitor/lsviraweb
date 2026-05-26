import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'LeadScrap | Captação & Disparos Inteligentes',
  description: 'Plataforma de automação WhatsApp e extração Google Maps — ViraWeb',
  icons: { icon: '/logo.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body className="min-h-screen tech-bg antialiased font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
