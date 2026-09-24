import Link from 'next/link';
import { Logo } from '@/components/logo';

const steps = [
  ['01', 'Ajoutez votre produit', 'Collez un lien, importez une image ou renseignez les informations essentielles.'],
  ['02', 'Vérifiez la proposition', 'Zelvora structure la fiche et signale clairement ce qui reste à compléter.'],
  ['03', 'Publiez et vendez', 'Votre boutique, votre checkout et vos commandes sont prêts pour vos clients.']
];

export default function Home() {
  return <main className="min-h-screen overflow-hidden bg-[#F7F7FB]">
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
      <Logo />
      <nav className="hidden items-center gap-7 text-sm font-bold text-slate-600 md:flex"><a href="#comment">Comment ça marche</a><a href="#pourquoi">Pourquoi Zelvora</a><Link href="/login">Connexion</Link></nav>
      <Link href="/register" className="rounded-xl bg-ink px-4 py-2.5 text-sm font-extrabold text-white">Créer ma boutique</Link>
    </header>
    <section className="relative mx-auto max-w-6xl px-5 pb-20 pt-12 sm:px-8 lg:pb-28 lg:pt-20">
      <div className="absolute right-[-8%] top-8 -z-0 h-72 w-72 rounded-full bg-mango/50 blur-3xl" /><div className="absolute left-[35%] top-20 -z-0 h-72 w-72 rounded-full bg-violet/20 blur-3xl" />
      <div className="relative grid items-center gap-12 lg:grid-cols-[1.07fr_.93fr]">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet/15 bg-white/80 px-3 py-1.5 text-xs font-extrabold text-violet shadow-sm"><span className="h-2 w-2 rounded-full bg-mint ring-2 ring-mint/30" /> AI Commerce Builder pour l’Afrique</div>
          <h1 className="max-w-3xl text-5xl font-black leading-[.95] tracking-[-.065em] text-ink sm:text-6xl lg:text-7xl">Ton produit.<br /><span className="gradient-text">Ta boutique.</span><br />En quelques minutes.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">Zelvora transforme les informations de votre produit en une boutique de vente simple, soignée et prête à être personnalisée.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/register" className="rounded-xl bg-violet px-6 py-4 text-center font-extrabold text-white shadow-lg shadow-violet/25 transition hover:-translate-y-0.5">Créer ma boutique gratuitement <span aria-hidden>→</span></Link><a href="#comment" className="rounded-xl border border-slate-200 bg-white px-6 py-4 text-center font-extrabold text-ink transition hover:border-violet">Voir le parcours</a></div>
          <p className="mt-4 text-xs font-semibold text-slate-500">Aucune commission sur vos ventes · Paiement à la livraison prêt à activer</p>
        </div>
        <div className="relative mx-auto w-full max-w-md rounded-[2rem] bg-ink p-3 shadow-float">
          <div className="overflow-hidden rounded-[1.45rem] bg-[#fffcf8] p-5">
            <div className="flex items-center justify-between"><div className="flex items-center gap-2 font-black tracking-tight"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#efbca7] text-xs">N</span>Nafisa Home</div><span className="text-xs text-slate-400">•••</span></div>
            <div className="mt-5 rounded-2xl bg-[#efbca7] p-5"><p className="text-xs font-bold uppercase tracking-widest text-ink/60">La sélection qui simplifie vos journées</p><h2 className="mt-2 text-3xl font-black leading-none tracking-[-.05em]">Le confort,<br />chez vous.</h2><div className="mt-4 flex h-24 items-end justify-center rounded-xl bg-[#e6a990]"><span className="text-7xl">🛋️</span></div></div>
            <div className="mt-5 flex items-center justify-between"><div><p className="font-extrabold">Coussin Nuage</p><p className="text-sm font-bold text-slate-500">12 500 FCFA</p></div><span className="rounded-lg bg-ink px-3 py-2 text-xs font-bold text-white">Commander</span></div>
            <div className="mt-4 flex gap-2"><span className="h-2 flex-1 rounded-full bg-violet" /><span className="h-2 w-1/4 rounded-full bg-slate-200" /></div>
          </div>
        </div>
      </div>
    </section>
    <section id="comment" className="border-y border-slate-200 bg-white py-20"><div className="mx-auto max-w-6xl px-5 sm:px-8"><p className="text-center text-sm font-black uppercase tracking-[.18em] text-violet">Du produit à la vente</p><h2 className="mx-auto mt-3 max-w-2xl text-center text-3xl font-black tracking-[-.055em] sm:text-4xl">Un parcours guidé, sans jargon.</h2><div className="mt-12 grid gap-4 md:grid-cols-3">{steps.map(([n,title,text]) => <article key={n} className="rounded-2xl border border-slate-100 bg-[#FAFAFC] p-6"><p className="text-sm font-black text-violet">{n}</p><h3 className="mt-8 text-xl font-black tracking-tight">{title}</h3><p className="mt-3 leading-7 text-slate-600">{text}</p></article>)}</div></div></section>
    <section id="pourquoi" className="mx-auto max-w-6xl px-5 py-20 sm:px-8"><div className="rounded-[2rem] bg-ink px-7 py-12 text-white sm:px-12"><div className="grid gap-10 lg:grid-cols-2 lg:items-end"><div><p className="text-sm font-black uppercase tracking-[.18em] text-mint">Le contrôle reste entre vos mains</p><h2 className="mt-4 text-4xl font-black leading-none tracking-[-.055em] sm:text-5xl">L’IA accélère.<br />Vous décidez.</h2></div><p className="max-w-xl text-lg leading-8 text-slate-300">Chaque suggestion est modifiable. Lorsqu’une information essentielle manque, Zelvora l’indique au lieu de l’inventer. Vous publiez une boutique qui vous ressemble.</p></div><div className="mt-10 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-white/10 p-5"><p className="text-2xl">✦</p><p className="mt-4 font-extrabold">Mobile d’abord</p></div><div className="rounded-2xl bg-white/10 p-5"><p className="text-2xl">◎</p><p className="mt-4 font-extrabold">Paiement à la livraison</p></div><div className="rounded-2xl bg-white/10 p-5"><p className="text-2xl">↗</p><p className="mt-4 font-extrabold">Vendez depuis vos réseaux</p></div></div></div></section>
    <footer className="border-t border-slate-200 px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 text-sm font-medium text-slate-500 sm:flex-row"><Logo /><span>© {new Date().getFullYear()} Zelvora · Une base e-commerce pensée pour l’Afrique.</span></div></footer>
  </main>;
}
