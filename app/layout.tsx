import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'HabitFlow AI',
  description: 'Gestor de fricción para hábitos elásticos — Coach IA, hábitos adaptativos, resultados reales',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HabitFlow',
  },
  openGraph: {
    title: 'HabitFlow AI',
    description: 'Construye hábitos que duran con inteligencia artificial',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0b10',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--text))] antialiased">
        <AuthProvider>
          <div className="mx-auto max-w-md min-h-screen relative">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
