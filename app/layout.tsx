import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const poppins = Poppins({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Gmatez Admin',
  description: 'Operations console for the Gmatez calling platform',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
