import Link from 'next/link';
import { Logo } from '@/components/logo';

const highlights = [
  { icon: '↗', title: 'Import intelligent', text: 'Lien, image ou informations déjà connues.' },
  { icon: '◉', title: 'Pensé pour mobile', text: 'Une boutique lisible là où vos clients achètent.' },
  { icon: '✦', title: 'Contenu sous contrôle', text: 'Des suggestions modifiables, jamais des faits inventés.' }
];

const workflow = [
  ['01', 'Importez votre produit', 'Ajoutez un lien, une image ou vos informations.'],
  ['02', 'Affinez votre univers', 'Choisissez un thème et ajustez chaque suggestion.'],
  ['03', 'Publiez, puis vendez', 'Partagez votre boutique et suivez vos commandes.']
];

function BuilderPreview() {
  return <div className="relative mx-auto w-full max-w-[650px] rounded-[1.75rem] border border-slate-200 bg-white p-2 shadow-[0_28px_90px_rgba(24,31,53,.16)] sm:p-3">
    <div className="overflow-hidden rounded-[1.25rem] border border-slate-100 bg-[#F9FAFE]">
      <div className="flex items-center justify-between border-b border-slate-100 bg-white px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-lg bg-violet text-[10px] font-black text-white">Z</span><span className="text-[11px] font-black text-ink sm:text-xs">Studio Zelvora</span></div>
        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-mint" /> Sauvegardé</div>
      </div>
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-100 bg-white px-3 py-2.5 text-[9px] font-black sm:justify-center sm:gap-2 sm:px-4 sm:text-[10px]">
        <span className="rounded-full bg-violet px-2.5 py-1.5 text-white">1 · Produit</span><span className="shrink-0 text-slate-300">→</span><span className="shrink-0 rounded-full border border-slate-200 px-2.5 py-1.5 text-slate-500">2 · Identité</span><span className="shrink-0 text-slate-300">→</span><span className="shrink-0 rounded-full border border-slate-200 px-2.5 py-1.5 text-slate-500">3 · Boutique</span><span className="shrink-0 text-slate-300">→</span><span className="shrink-0 rounded-full border border-slate-200 px-2.5 py-1.5 text-slate-500">Publier</span>
      </div>
      <div className="grid min-h-[375px] sm:grid-cols-[.7fr_1.3fr]">
        <aside className="hidden border-r border-slate-100 bg-white p-3 sm:block">
          <p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-400">Construire la page</p>
          <div className="mt-3 space-y-1.5">
            {['Image de couverture', 'Bénéfices vérifiés', 'Détails du produit', 'FAQ & réassurance'].map((label, index) => <div key={label} className={`rounded-lg border px-2.5 py-2 text-[10px] font-bold ${index === 0 ? 'border-violet/30 bg-violet/5 text-violet' : 'border-slate-100 text-slate-500'}`}><span className="mr-1.5 text-slate-400">{index + 1}.</span>{label}</div>)}
          </div>
          <div className="mt-4 rounded-lg bg-[#F6F7FB] p-2.5"><p className="text-[9px] font-black text-ink">Le saviez-vous ?</p><p className="mt-1 text-[9px] leading-4 text-slate-500">Les informations sensibles restent signalées à vérifier.</p></div>
        </aside>
        <div className="p-3 sm:p-4">
          <div className="mb-2.5 flex items-center justify-between"><p className="text-[9px] font-black text-slate-500">Aperçu de la boutique</p><div className="rounded-md bg-slate-100 px-2 py-1 text-[8px] font-black text-slate-500">MOBILE</div></div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-[8px] font-black"><span className="flex items-center gap-1.5"><i className="h-3.5 w-3.5 rounded bg-[#F6B867]" /> Amani Studio</span><span className="text-slate-400">Accueil · Panier</span></div>
            <div className="grid grid-cols-[.9fr_1.1fr] gap-2.5 bg-[#FEFAF2] p-3 sm:gap-4 sm:p-4">
              <div className="relative grid min-h-40 place-items-center overflow-hidden rounded-xl bg-[#F6B867]/30 sm:min-h-48"><div className="absolute left-3 top-3 rounded-full bg-white/80 px-2 py-1 text-[7px] font-black text-[#815023]">NOUVEAUTÉ</div><div className="relative h-24 w-16 rounded-[1.4rem] border-[5px] border-[#26304B] bg-[#F6B867] shadow-lg sm:h-32 sm:w-20"><span className="absolute left-1/2 top-3 h-7 w-7 -translate-x-1/2 rounded-full border-[3px] border-[#26304B] bg-[#FFF6D9] sm:h-9 sm:w-9" /><span className="absolute bottom-3 left-1/2 h-1.5 w-8 -translate-x-1/2 rounded-full bg-[#26304B]" /></div><span className="absolute bottom-3 text-[7px] font-black text-[#815023]">LAMPE NOMADE</span></div>
              <div className="py-1"><p className="text-[7px] font-black uppercase tracking-[.14em] text-violet">Éclairez simplement</p><h2 className="mt-2 text-base font-black leading-[.95] tracking-[-.06em] text-ink sm:text-xl">Luma, la lumière qui vous suit.</h2><p className="mt-2 line-clamp-3 text-[8px] leading-3 text-slate-500 sm:text-[9px] sm:leading-4">Compacte, pratique et pensée pour vos soirées, vos déplacements et vos coupures.</p><p className="mt-3 text-xs font-black text-ink sm:text-sm">18 500 <span className="text-[8px]">FCFA</span></p><div className="mt-2 space-y-1 text-[7px] font-bold text-slate-500"><p>✓ Utilisation simple</p><p>✓ Design compact</p></div><div className="mt-3 rounded-lg bg-violet px-2 py-2 text-center text-[8px] font-black text-white">COMMANDER</div></div>
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-slate-100 bg-white p-2.5"><div className="flex items-center justify-between"><p className="text-[9px] font-black">Vos espaces récents</p><p className="text-[8px] font-bold text-violet">Voir tout</p></div><div className="mt-2 grid grid-cols-3 gap-2"><div className="h-11 rounded-md bg-[#E9E5FF]" /><div className="h-11 rounded-md bg-[#D8F1E3]" /><div className="h-11 rounded-md bg-[#FFE4C7]" /></div></div>
        </div>
      </div>
    </div>
  </div>;
}

export default function Home() {
  return <main className="min-h-screen overflow-hidden bg-[#FCFCFE] text-ink">
    <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
      <Logo />
      <nav className="hidden items-center gap-7 text-sm font-extrabold text-slate-600 lg:flex"><a className="transition hover:text-violet" href="#parcours">Le parcours</a><a className="transition hover:text-violet" href="#pourquoi">Pourquoi Zelvora</a><Link className="transition hover:text-violet" href="/login">Connexion</Link></nav>
      <Link href="/register" className="rounded-xl bg-ink px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-ink/10 transition hover:-translate-y-0.5">Commencer</Link>
    </header>

    <section className="relative mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8 lg:pb-24 lg:pt-16">
      <div aria-hidden className="absolute right-[-15rem] top-[-10rem] h-[36rem] w-[36rem] rounded-full bg-violet/[.07] blur-3xl" /><div aria-hidden className="absolute left-[19%] top-20 h-52 w-52 rounded-full bg-mango/[.12] blur-3xl" />
      <div className="relative grid items-center gap-12 lg:grid-cols-[.92fr_1.08fr] lg:gap-8">
        <div className="max-w-2xl"><div className="inline-flex items-center gap-2 rounded-full border border-violet/15 bg-white px-3 py-1.5 text-xs font-black text-violet shadow-sm"><span className="grid h-4 w-4 place-items-center rounded-full bg-violet text-[9px] text-white">Z</span> Commerce IA conçu pour l’Afrique</div><h1 className="mt-6 text-5xl font-black leading-[.94] tracking-[-.075em] text-ink sm:text-6xl xl:text-7xl">Passez du produit<br />à une <span className="gradient-text">boutique</span><br />prête à vendre.</h1><p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">Zelvora rassemble l’import produit, la création de boutique et les commandes dans un parcours simple — avec des suggestions que vous contrôlez toujours.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/register" className="rounded-xl bg-violet px-6 py-4 text-center font-extrabold text-white shadow-lg shadow-violet/25 transition hover:-translate-y-0.5">Créer ma boutique <span aria-hidden>→</span></Link><a href="#parcours" className="rounded-xl border border-slate-200 bg-white px-6 py-4 text-center font-extrabold transition hover:border-violet hover:text-violet">Découvrir le parcours</a></div><p className="mt-4 text-xs font-semibold text-slate-500">Sans commission sur vos ventes · Checkout à la livraison inclus</p>
          <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">{highlights.map((highlight) => <article key={highlight.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className="grid h-8 w-8 place-items-center rounded-lg bg-violet/10 text-sm font-black text-violet">{highlight.icon}</span><h2 className="mt-4 text-sm font-black tracking-tight">{highlight.title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{highlight.text}</p></article>)}</div>
        </div>
        <BuilderPreview />
      </div>
    </section>

    <section id="parcours" className="border-y border-slate-200 bg-white py-20 sm:py-24"><div className="mx-auto max-w-7xl px-5 sm:px-8"><div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><div><p className="text-sm font-black uppercase tracking-[.18em] text-violet">Un seul parcours</p><h2 className="mt-3 text-4xl font-black leading-[.98] tracking-[-.06em] sm:text-5xl">Moins de bricolage.<br />Plus de vente.</h2></div><p className="max-w-xl text-lg leading-8 text-slate-600">Chaque étape est pensée pour vous laisser la main : les informations non trouvées sont signalées, les propositions peuvent être modifiées et rien n’est publié sans votre validation.</p></div><div className="mt-12 grid gap-4 md:grid-cols-3">{workflow.map(([number, title, text]) => <article key={number} className="rounded-2xl bg-[#F7F7FB] p-6"><p className="text-sm font-black text-violet">{number}</p><h3 className="mt-10 text-xl font-black tracking-tight">{title}</h3><p className="mt-3 leading-7 text-slate-600">{text}</p></article>)}</div></div></section>

    <section id="pourquoi" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24"><div className="rounded-[2rem] bg-ink px-7 py-12 text-white sm:px-12 sm:py-14"><div className="grid gap-10 lg:grid-cols-2 lg:items-end"><div><p className="text-sm font-black uppercase tracking-[.18em] text-mint">IA responsable, commerce réel</p><h2 className="mt-4 text-4xl font-black leading-[.96] tracking-[-.06em] sm:text-5xl">L’IA prépare.<br />Vous décidez.</h2></div><p className="max-w-xl text-lg leading-8 text-slate-300">Zelvora ne transforme pas une suggestion en vérité. Les caractéristiques, promesses, prix et informations commerciales restent à vérifier avant votre publication.</p></div><div className="mt-10 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-white/10 p-5"><p className="text-2xl text-mint">✦</p><p className="mt-4 font-extrabold">Suggestions éditables</p><p className="mt-2 text-sm leading-6 text-slate-300">Gardez le dernier mot sur votre contenu.</p></div><div className="rounded-2xl bg-white/10 p-5"><p className="text-2xl text-mint">◉</p><p className="mt-4 font-extrabold">Vraies commandes</p><p className="mt-2 text-sm leading-6 text-slate-300">Suivez les commandes depuis votre espace.</p></div><div className="rounded-2xl bg-white/10 p-5"><p className="text-2xl text-mint">↗</p><p className="mt-4 font-extrabold">Votre marque</p><p className="mt-2 text-sm leading-6 text-slate-300">Une boutique à partager depuis vos réseaux.</p></div></div></div></section>

    <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8"><div className="rounded-[2rem] border border-violet/15 bg-violet/[.05] px-7 py-12 text-center sm:px-12"><p className="text-sm font-black uppercase tracking-[.18em] text-violet">Prêt à commencer ?</p><h2 className="mx-auto mt-4 max-w-2xl text-4xl font-black leading-[.98] tracking-[-.06em] sm:text-5xl">Votre premier produit peut devenir votre première boutique.</h2><p className="mx-auto mt-5 max-w-xl leading-7 text-slate-600">Ajoutez-le, vérifiez vos informations et créez une page prête à recevoir vos commandes.</p><Link href="/register" className="mt-8 inline-block rounded-xl bg-violet px-6 py-4 font-extrabold text-white shadow-lg shadow-violet/25">Démarrer gratuitement →</Link></div></section>

    <footer className="border-t border-slate-200 px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-sm font-medium text-slate-500 sm:flex-row"><Logo /><span>© {new Date().getFullYear()} Zelvora · Commerce IA, sous votre contrôle.</span></div></footer>
  </main>;
}
