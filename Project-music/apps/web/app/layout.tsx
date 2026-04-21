import './globals.css';
import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { ServiceWorkerRegister } from '../components/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'SyncJam',
  description: 'Listen together, free.',
  manifest: '/manifest.webmanifest',
  applicationName: 'SyncJam',
  appleWebApp: {
    capable: true,
    title: 'SyncJam',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
