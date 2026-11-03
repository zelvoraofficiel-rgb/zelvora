'use client';
import {useEffect,useState} from 'react';

type Interval='MONTHLY'|'YEARLY';
export function SubscriptionClient(){
 const[base,setBase]=useState<any>();
 const[plans,setPlans]=useState<any[]>([]);
 const[plan,setPlan]=useState<any>();
 const[interval,setInterval]=useState<Interval>('MONTHLY');
 const[manual,setManual]=useState<any>({methods:[],requests:[]});
 const[methodId,setMethodId]=useState('');
 const[reference,setReference]=useState('');
 const[proof,setProof]=useState<File|null>(null);
 const[busy,setBusy]=useState(false);
 const[msg,setMsg]=useState('');
 const load=()=>Promise.all([
  fetch('/api/subscription').then(r=>r.json()),
  fetch('/api/subscription/bawaex/checkout').then(r=>r.json()),
  fetch('/api/subscription/manual').then(r=>r.json())
 ]).then(([a,b,m])=>{
  setBase(a);setPlans(b.plans||m.plans||[]);setManual(m);
  const first=(b.plans||m.plans||[])[0];if(first)setPlan((p:any)=>p||first);
  if(m.methods?.[0])setMethodId((x:string)=>x||m.methods[0].id);
 }).catch(e=>setMsg(e.message));
 useEffect(()=>{load();const q=new URLSearchParams(location.search),id=q.get('payment');if(q.get('bawaex')==='return'&&id){setBusy(true);setMsg('Vérification sécurisée du paiement BawaEX…');fetch(`/api/subscription/bawaex/status?payment=${encodeURIComponent(id)}`).then(async r=>{const j=await r.json();if(!r.ok)throw Error(j.error);setMsg(j.activated?'✅ Paiement confirmé. Votre abonnement PRO est actif.':'Paiement encore en attente de confirmation BawaEX.');if(j.activated)load()}).catch(e=>setMsg(e.message)).finally(()=>setBusy(false))}},[]);
 async function payBawaex(){if(!plan)return;setBusy(true);setMsg('Création de votre page de paiement BawaEX…');try{const r=await fetch('/api/subscription/bawaex/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({planId:plan.id,billingInterval:interval})}),j=await r.json();if(!r.ok)throw Error(j.error);location.assign(j.paymentUrl)}catch(e){setMsg(e instanceof Error?e.message:'Paiement indisponible.');setBusy(false)}}
 async function submitManual(){if(!plan||!methodId||!proof)return setMsg('Choisissez un moyen de paiement et ajoutez la preuve du reçu.');setBusy(true);setMsg('Envoi sécurisé de votre preuve…');const form=new FormData();form.set('planId',plan.id);form.set('methodId',methodId);form.set('billingInterval',interval);form.set('reference',reference);form.set('proof',proof);try{const r=await fetch('/api/subscription/manual',{method:'POST',body:form}),j=await r.json();if(!r.ok)throw Error(j.error);setMsg('✅ Preuve envoyée. Votre abonnement sera activé après vérification par un administrateur.');setReference('');setProof(null);await load()}catch(e){setMsg(e instanceof Error?e.message:'Envoi impossible.')}finally{setBusy(false)}}
 if(!base)return <div className="state-loading">Chargement…</div>;
 const s=base.subscription,amount=Number(interval==='YEARLY'?plan?.price_yearly:plan?.price_monthly||0);
 return <><div className="page-heading"><div><p className="eyebrow">ABONNEMENT · PLAN PRO</p><h1>Mon abonnement</h1><p>Paiement BawaEX ou dépôt manuel avec preuve de reçu.</p></div></div>
 {s&&<article className="data-card subscription-hero"><span className="status-pill">{s.status}</span><h2>{s.plans?.name}</h2><p>Expiration : {s.current_period_end?new Date(s.current_period_end).toLocaleDateString('fr-FR'):'Non définie'}</p></article>}
 <h2 className="mt-10 text-2xl font-black">Choisir la durée du plan PRO</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{plans.map(x=><article key={x.id} className={`data-card ${plan?.id===x.id?'ring-2 ring-blue-500':''}`}><b className="text-blue-400">{x.name}</b><div className="mt-4 grid grid-cols-2 gap-2"><button onClick={()=>{setPlan(x);setInterval('MONTHLY')}} className={`rounded-lg p-3 font-black ${interval==='MONTHLY'?'bg-blue-600 text-white':'bg-white/5'}`}>{Number(x.price_monthly).toLocaleString('fr-FR')} FCFA/mois</button><button onClick={()=>{setPlan(x);setInterval('YEARLY')}} className={`rounded-lg p-3 font-black ${interval==='YEARLY'?'bg-blue-600 text-white':'bg-white/5'}`}>{Number(x.price_yearly).toLocaleString('fr-FR')} FCFA/an</button></div></article>)}</div>
 {plan&&<div className="mt-7 grid gap-5 lg:grid-cols-2"><section className="data-card border-blue-500/40"><h2 className="text-2xl font-black">Payer avec BawaEX</h2><p className="mt-2 text-slate-500">Paiement en ligne via la page sécurisée BawaEX.</p><p className="mt-4 text-2xl font-black text-blue-400">{amount.toLocaleString('fr-FR')} FCFA</p><button disabled={busy} onClick={payBawaex} className="primary-action mt-5">Continuer vers BawaEX</button></section>
 <section className="data-card border-emerald-500/40"><h2 className="text-2xl font-black">Dépôt manuel avec reçu</h2><p className="mt-2 text-slate-500">Effectuez le dépôt, puis envoyez une preuve. L’activation a lieu uniquement après vérification.</p><div className="mt-4 space-y-3">{manual.methods?.map((m:any)=><label key={m.id} className={`block cursor-pointer rounded-xl border p-4 ${methodId===m.id?'border-emerald-400 bg-emerald-400/5':'border-white/10'}`}><input type="radio" name="manual-method" checked={methodId===m.id} onChange={()=>setMethodId(m.id)}/> <b>{m.name}</b><div className="mt-1 text-lg font-black">{m.account_number}</div><small>{m.instructions}</small></label>)}</div><label className="mt-4 block">Référence de transaction (facultative)<input className="form-input mt-2 w-full" value={reference} onChange={e=>setReference(e.target.value)} maxLength={120}/></label><label className="mt-4 block">Preuve du reçu (JPG, PNG, WEBP ou PDF — 5 Mo maximum)<input className="mt-2 block w-full" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>setProof(e.target.files?.[0]||null)}/></label><button disabled={busy||!methodId||!proof} onClick={submitManual} className="primary-action mt-5">Envoyer la preuve</button></section></div>}
 {manual.requests?.length>0&&<section className="data-card mt-7"><h2>Mes demandes manuelles</h2><div className="mt-3 space-y-2">{manual.requests.map((r:any)=><div key={r.id} className="flex flex-wrap justify-between gap-3 rounded-xl bg-white/5 p-3"><span>{r.manual_payment_methods?.name} · {Number(r.amount).toLocaleString('fr-FR')} FCFA</span><b>{r.status==='PENDING'?'EN ATTENTE':r.status==='CONFIRMED'?'CONFIRMÉ':'REFUSÉ'}</b>{r.rejection_reason&&<small className="w-full text-red-300">{r.rejection_reason}</small>}</div>)}</div></section>}
 {msg&&<div className="mt-5 rounded-xl bg-blue-500/10 p-4 text-blue-200">{msg}</div>}</>;
}
