import Link from 'next/link';
import { Logo } from '@/components/logo';

type Tab = 'dashboard' | 'products' | 'analysis' | 'orders' | 'store';
const tabs: Array<{ id: Tab; label: string; href: string }> = [
  { id: 'dashboard', label: 'Vue d’ensemble', href: '/dashboard' },
  { id: 'products', label: 'Produits', href: '/products' },
  { id: 'analysis', label: 'Analyse IA', href: '/analysis' },
  { id: 'orders', label: 'Commandes', href: '/orders' },
  { id: 'store', label: 'Boutique', href: '/dashboard' }
];

export function AppNav({ active }: { active: Tab }) {
  return <header className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-7xl px-5 sm:px-8"><div className="flex items-center justify-between gap-4 py-4"><Logo href="/dashboard" /><Link href="/" className="shrink-0 text-sm font-extrabold text-slate-500 hover:text-ink">Quitter</Link></div><nav aria-label="Navigation de l’espace marchand" className="-mx-5 flex gap-1 overflow-x-auto px-5 sm:mx-0 sm:px-0">{tabs.map((tab) => <Link key={tab.id} href={tab.href} aria-current={active === tab.id ? 'page' : undefined} className={`shrink-0 border-b-2 px-3 py-3 text-sm font-extrabold transition ${active === tab.id ? 'border-violet text-violet' : 'border-transparent text-slate-500 hover:border-slate-200 hover:text-ink'}`}>{tab.label}</Link>)}</nav></div></header>;
}
