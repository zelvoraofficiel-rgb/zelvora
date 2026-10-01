'use client';
import { useEffect, useState } from 'react';

export function NotificationsClient(){
 const [items,setItems]=useState<any[]|null>(null);const [error,setError]=useState('');
 const [permission,setPermission]=useState<NotificationPermission|'unsupported'>('unsupported');
 const load=()=>fetch('/api/notifications',{cache:'no-store'}).then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error);return j.notifications}).then(setItems).catch(e=>setError(e.message));
 useEffect(()=>{load();setPermission('Notification'in window?Notification.permission:'unsupported')},[]);
 async function activate(){if(!('Notification'in window))return;const value=await Notification.requestPermission();setPermission(value);if(value==='granted'&&'serviceWorker'in navigator){await navigator.serviceWorker.register('/sw.js');const registration=await navigator.serviceWorker.ready;registration.showNotification('Notifications Zelvora activées',{body:'Vous serez alerté des nouvelles commandes lorsque Zelvora est ouvert.',icon:'/icons/icon-192.png',tag:'zelvora-enabled',data:{url:'/notifications'}})}}
 async function read(id:string){const r=await fetch('/api/notifications',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id})});if(r.ok)load()}
 if(error)return <div className="state-error">{error}</div>;if(!items)return <div className="state-loading">Chargement des notifications…</div>;
 return <><div className="page-heading"><div><p className="eyebrow">ACTIVITÉ</p><h1>Notifications</h1><p>Commandes et informations importantes de votre boutique.</p></div>{permission!=='granted'&&permission!=='unsupported'&&<button className="primary-action" onClick={activate}>Activer les alertes PWA</button>}{permission==='granted'&&<span className="rounded-xl bg-emerald-500/15 px-4 py-3 text-sm font-bold text-emerald-300">Alertes PWA activées</span>}</div>{permission==='denied'&&<div className="state-error">Les notifications sont bloquées dans le navigateur. Autorisez-les depuis l’icône à gauche de l’adresse du site.</div>}{items.length?<div className="stack-list">{items.map(n=><article key={n.id} className={`notice-row ${n.read||n.readAt?'is-read':''}`}><div><strong>{n.title}</strong><p>{n.body||'Aucun détail supplémentaire.'}</p><small>{new Date(n.createdAt).toLocaleString('fr-FR')}</small></div>{!(n.read||n.readAt)&&<button onClick={()=>read(n.id)}>Marquer comme lue</button>}</article>)}</div>:<div className="empty-panel"><span>🔔</span><h2>Vous êtes à jour</h2><p>Aucune notification pour le moment.</p></div>}</>
}
