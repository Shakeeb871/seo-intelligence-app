import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SEO Intelligence',
  description: 'Master SEO + AEO + Content Writing Intelligence System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-stone-50 antialiased">{children}</body>
    </html>
  );
}
