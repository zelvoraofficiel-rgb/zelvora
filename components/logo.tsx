import Link from 'next/link';
export function Logo({ href = '/', light = false }: { href?: string; light?: boolean }) {
  return <Link href={href} className={`inline-flex items-center gap-2 font-black tracking-[-0.06em] text-xl ${light ? 'text-white' : 'text-ink'}`} aria-label="Zelvora, accueil">
    <span className="grid h-8 w-8 place-items-center rounded-xl bg-violet text-base tracking-normal text-white shadow-sm">Z</span><span>Zelvora</span>
  </Link>;
}
