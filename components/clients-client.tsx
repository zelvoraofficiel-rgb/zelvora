'use client';
import { useEffect, useMemo, useState } from 'react';
const money = (value: number) => `${Math.round(value).toLocaleString('fr-FR')} FCFA`;
export function ClientsClient() {
  const [clients, setClients] = useState<any[] | null>(null); const [query, setQuery] = useState(''); const [error, setError] = useState('');
  useEffect(() => { fetch('/api/clients').then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error); return j.clients; }).then(setClients).catch(e => setError(e.message)); }, []);
  const visible = useMemo(() => (clients || []).filter(c => `${c.name} ${c.phone} ${c.email || ''}`.toLowerCase().includes(query.toLowerCase())), [clients, query]);
  if (error) return <div className="state-error">{error}</div>; if (!clients) return <div className="state-loading">Chargement des clients…</div>;
  return <><div className="page-heading"><div><p className="eyebrow">RELATION CLIENT</p><h1>Clients</h1><p>Les clients sont créés automatiquement à partir des commandes réelles.</p></div></div><div className="toolbar"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher un nom, téléphone ou e-mail" aria-label="Rechercher un client" /></div>{visible.length ? <div className="data-card"><div className="table-wrap"><table><thead><tr><th>Client</th><th>Contact</th><th>Commandes</th><th>Total dépensé</th><th>Dernière commande</th></tr></thead><tbody>{visible.map(c=><tr key={c.id}><td><strong>{c.name}</strong></td><td>{c.phone}<br/><small>{c.email || 'Aucun e-mail'}</small></td><td>{c.orderCount}</td><td>{money(c.totalSpent)}</td><td>{c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString('fr-FR') : '—'}</td></tr>)}</tbody></table></div></div> : <div className="empty-panel"><span>♙</span><h2>Aucun client pour le moment</h2><p>Les fiches clients apparaîtront ici dès votre première commande.</p></div>}</>;
}
