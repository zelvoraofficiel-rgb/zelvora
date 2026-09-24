import type { Metadata } from 'next';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'Zelvora — Ton produit. Ta boutique.',
  description: 'L’AI Commerce Builder pensé pour les entrepreneurs africains.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr" suppressHydrationWarning><body>{children}</body></html>;
}
