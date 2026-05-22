import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata = {
  title: 'DataPulse — CSV Endpoint Monitor',
  description:
    'Store, monitor, and track changes across your CSV API endpoints with a beautiful notebook-style interface.',
  keywords: ['CSV', 'API', 'monitor', 'data', 'endpoint'],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
