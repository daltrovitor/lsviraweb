import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "LeadScrap (LS da ViraWeb) | Captação & Disparos Inteligentes",
  description: "Plataforma de automação avançada de WhatsApp e extração inteligente do Google Maps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body className="min-h-screen premium-bg text-navy-950 antialiased selection:bg-gold-400/30 selection:text-navy-900 overflow-x-hidden font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
