import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Device Provisioner',
  description:
    'Mint unique device IDs, pick a hardware version, and emit the 8-byte binary your bootloader reads.',
  manifest: '/manifest.webmanifest',
  applicationName: 'Device Provisioner',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Provisioner',
  },
  icons: {
    icon: '/icons/favicon-32.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b1f33',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
