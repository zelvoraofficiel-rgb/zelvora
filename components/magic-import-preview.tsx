'use client';

export type MagicTheme = {
  id: 'aura' | 'sahel' | 'noir';
  name: string;
  label: string;
  primary: string;
  accent: string;
  surface: string;
};

export const magicThemes: MagicTheme[] = [
  { id: 'aura', name: 'Aura', label: 'Frais & premium', primary: '#6557F5', accent: '#B9F6D0', surface: '#F2F1FF' },
  { id: 'sahel', name: 'Sahel', label: 'Chaleureux & artisanal', primary: '#B75427', accent: '#FFD17A', surface: '#FFF4E8' },
  { id: 'noir', name: 'Noir', label: 'Épuré & affirmé', primary: '#111729', accent: '#C4F6D1', surface: '#EDF2F0' }
];

export function MagicThemePicker({ selected, onSelect }: { selected: MagicTheme['id']; onSelect: (theme: MagicTheme) => void }) {
  return <div className="mt-4 grid gap-2 sm:grid-cols-3">{magicThemes.map((theme) => <button type="button" key={theme.id} onClick={() => onSelect(theme)} className={`rounded-xl border p-3 text-left transition ${selected === theme.id ? 'border-violet bg-violet/5 ring-2 ring-violet/10' : 'border-slate-200 bg-white hover:border-violet/40'}`}>
    <span className="flex gap-1"><i className="h-4 w-4 rounded-full" style={{ backgroundColor: theme.primary }} /><i className="h-4 w-4 rounded-full" style={{ backgroundColor: theme.accent }} /><i className="h-4 w-4 rounded-full border border-slate-200" style={{ backgroundColor: theme.surface }} /></span>
    <span className="mt-3 block text-sm font-black">{theme.name}</span><span className="mt-0.5 block text-xs text-slate-500">{theme.label}</span>
  </button>)}</div>;
}

export function MagicMobilePreview({ theme, storeName, tagline, productName, description, price, imageUrl, benefits }: { theme: MagicTheme; storeName: string; tagline: string; productName: string; description: string; price: string; imageUrl?: string; benefits: string[] }) {
  const safeBenefits = benefits.filter((benefit) => benefit && !/à compléter|à vérifier/i.test(benefit)).slice(0, 2);
  return <aside className="mx-auto w-full max-w-sm rounded-[2rem] bg-ink p-2.5 shadow-float lg:sticky lg:top-6"><div className="overflow-hidden rounded-[1.45rem] bg-white"><div className="flex items-center justify-between px-4 py-3 text-[10px] font-black"><span style={{ color: theme.primary }}>{storeName || 'Ma boutique'}</span><span className="text-slate-400">⌁ ☰</span></div><div className="px-3 pb-4"><div className="min-h-40 rounded-2xl p-4" style={{ backgroundColor: theme.surface }}><p className="text-[9px] font-black uppercase tracking-[.12em]" style={{ color: theme.primary }}>Créé avec Zelvora</p><p className="mt-2 text-lg font-black leading-5 tracking-[-.05em] text-ink">{tagline || 'Une sélection qui vous ressemble.'}</p><div className="mt-3 grid h-24 place-items-center overflow-hidden rounded-xl bg-white/70">{imageUrl ? <img src={imageUrl} alt="Aperçu produit" className="h-full w-full object-contain" /> : <span className="text-4xl" style={{ color: theme.primary }}>✦</span>}</div></div><div className="px-1 pt-4"><p className="text-[9px] font-black uppercase tracking-[.12em]" style={{ color: theme.primary }}>Produit vedette</p><h3 className="mt-1 text-base font-black tracking-[-.045em]">{productName || 'Votre produit'}</h3><p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">{description || 'Les informations de votre produit apparaîtront ici.'}</p><p className="mt-3 text-base font-black">{price ? `${Number(price.replace(',', '.')).toLocaleString('fr-FR')} FCFA` : 'Prix à renseigner'}</p>{safeBenefits.length > 0 && <div className="mt-3 space-y-1">{safeBenefits.map((benefit) => <p key={benefit} className="text-[10px] font-bold text-slate-600">✓ {benefit}</p>)}</div>}<button type="button" className="mt-4 w-full rounded-lg py-2.5 text-[11px] font-black text-white" style={{ backgroundColor: theme.primary }}>Commander maintenant</button></div></div></div><p className="px-2 pb-1 pt-3 text-center text-[10px] font-bold text-white/70">Aperçu mobile · visible avant publication</p></aside>;
}
