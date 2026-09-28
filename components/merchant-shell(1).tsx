import Link from 'next/link';
import { ReactNode } from 'react';
import { Logo } from '@/components/logo';

type Workspace = 'dashboard' | 'orders' | 'products' | 'analysis' | 'studio';
const primary: Array<{ id: Workspace; label: string; href: string; icon: string }> = [
  { id: 'dashboard', label: 'Tableau de bord', href: '/dashboard', icon: '▦' },
  { id: 'orders', label: 'Commandes', href: '/orders', icon: '□' },
  { id: 'products', label: 'Produits', href: '/products', icon: '◇' }
];
const creation: Array<{ id: Workspace; label: string; href: string; icon: string }> = [
  { id: 'studio', label: 'Ma boutique', href: '/studio', icon: '⌂' },
  { id: 'analysis', label: 'Analyse IA', href: '/analysis', icon: '✦' }
];

function Navigation({ active, compact = false }: { active: Workspace; compact?: boolean }) {
  const item = (entry: { id: Workspace; label: string; href: string; icon: string }) => <Link key={entry.id} href={entry.href} aria-current={active === entry.id ? 'page' : undefined} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-extrabold transition ${active === entry.id ? 'bg-white/12 text-white shadow-sm' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><span className={`grid h-5 w-5 place-items-center text-base ${active === entry.id ? 'text-mint' : 'text-slate-500'}`}>{entry.icon}</span>{entry.label}</Link>;
  if (compact) return <nav aria-label="Navigation de l’espace marchand" className="flex gap-1 overflow-x-auto px-4 py-2">{[...primary, ...creation].map((entry) => <Link key={entry.id} href={entry.href} aria-current={active === entry.id ? 'page' : undefined} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-extrabold ${active === entry.id ? 'bg-white/12 text-white' : 'text-slate-400'}`}>{entry.label}</Link>)}</nav>;
  return <nav className="mt-8 space-y-1" aria-label="Navigation de l’espace marchand"><p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-500">Commerce</p>{primary.map(item)}<p className="px-3 pb-2 pt-6 text-[10px] font-black uppercase tracking-[.16em] text-slate-500">Création</p>{creation.map(item)}</nav>;
}

export function MerchantShell({ active, children }: { active: Workspace; children: ReactNode }) {
  return <main className="min-h-screen bg-[#F6F7FB] text-ink"><aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-white/10 bg-[#0B1120] p-5 lg:flex"><Logo href="/dashboard" light /><Navigation active={active} /><div className="mt-auto rounded-2xl border border-white/10 bg-white/[.04] p-4"><p className="text-xs font-black text-mint">ZELVORA WORKSPACE</p><p className="mt-2 text-sm font-bold leading-5 text-white">Vos données restent privées à votre organisation.</p><Link href="/" className="mt-4 inline-block text-xs font-extrabold text-slate-400 transition hover:text-white">Voir le site public ↗</Link></div></aside><div className="min-h-screen lg:pl-64"><header className="sticky top-0 z-10 border-b border-white/10 bg-[#0B1120] text-white"><div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8"><div className="lg:hidden"><Logo href="/dashboard" light /></div><p className="hidden text-sm font-bold text-slate-400 lg:block">Espace marchand</p><div className="flex items-center gap-3"><span className="hidden text-xs font-bold text-slate-400 sm:inline">Zelvora</span><Link href="/" className="grid h-8 w-8 place-items-center rounded-full bg-violet text-xs font-black text-white" aria-label="Ouvrir le site public">Z</Link></div></div><div className="border-t border-white/10 lg:hidden"><Navigation active={active} compact /></div></header><div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-9">{children}</div></div></main>;
}
