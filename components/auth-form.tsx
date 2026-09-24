'use client';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

type Mode = 'login' | 'register';
export function AuthForm({ mode }: { mode: Mode }) {
  const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('');
    const form = new FormData(event.currentTarget);
    const payload = { name: form.get('name'), email: form.get('email'), password: form.get('password') };
    const response = await fetch(`/api/auth/${mode === 'login' ? 'login' : 'register'}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const json = await response.json(); setLoading(false);
    if (!response.ok) { setError(json.error || 'Impossible de continuer.'); return; }
    router.push(mode === 'register' ? '/onboarding' : '/dashboard'); router.refresh();
  }
  const isLogin = mode === 'login';
  return <form onSubmit={submit} className="space-y-4">
    {!isLogin && <label className="block text-sm font-bold text-slate-700">Votre nom<input required name="name" minLength={2} maxLength={80} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-violet focus:ring-4 focus:ring-violet/10" placeholder="Aïcha Ibrahim" /></label>}
    <label className="block text-sm font-bold text-slate-700">Email<input required name="email" type="email" autoComplete="email" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-violet focus:ring-4 focus:ring-violet/10" placeholder="vous@exemple.com" /></label>
    <label className="block text-sm font-bold text-slate-700">Mot de passe<input required name="password" type="password" minLength={isLogin ? 1 : 10} autoComplete={isLogin ? 'current-password' : 'new-password'} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-violet focus:ring-4 focus:ring-violet/10" placeholder={isLogin ? 'Votre mot de passe' : '10 caractères minimum'} /></label>
    {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
    <button disabled={loading} className="w-full rounded-xl bg-violet px-4 py-3.5 font-extrabold text-white shadow-lg shadow-violet/25 transition hover:-translate-y-0.5">{loading ? 'Un instant…' : isLogin ? 'Se connecter' : 'Créer mon compte'}</button>
    <p className="text-center text-sm text-slate-600">{isLogin ? 'Nouveau sur Zelvora ? ' : 'Déjà un compte ? '}<Link className="font-extrabold text-violet hover:underline" href={isLogin ? '/register' : '/login'}>{isLogin ? 'Créer un compte' : 'Se connecter'}</Link></p>
  </form>;
}
