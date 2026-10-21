import type { Metadata } from 'next';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'Zelvora — Ton produit. Ta boutique.',
  description: 'L’AI Commerce Builder pensé pour les entrepreneurs africains.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Zelvora', statusBarStyle: 'black-translucent' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/icon-192.png' }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabaseOrigin=process.env.NEXT_PUBLIC_SUPABASE_URL;
  return <html lang="fr" suppressHydrationWarning><head>{supabaseOrigin&&<><link rel="preconnect" href={supabaseOrigin}/><link rel="dns-prefetch" href={supabaseOrigin}/></>}</head><body>{children}</body></html>;
}
