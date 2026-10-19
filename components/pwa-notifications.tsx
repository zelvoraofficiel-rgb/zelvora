'use client';
import{useEffect,useState}from'react';
function vapidKey(value:string){const padded=value+'='.repeat((4-value.length%4)%4);const raw=atob(padded.replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)))}
export function PwaNotifications(){
 const[ready,setReady]=useState(false),[enabled,setEnabled]=useState(false),[busy,setBusy]=useState(false);
 useEffect(()=>{
  if(!('serviceWorker'in navigator)||!('PushManager'in window))return;
  setReady(true);navigator.serviceWorker.register('/sw.js').then(async reg=>setEnabled(Boolean(await reg.pushManager.getSubscription()))).catch(()=>{});
  let stopped=false;let known=new Set<string>();
  const check=async(first=false)=>{if(stopped||document.visibilityState!=='visible')return;try{const r=await fetch('/api/notifications',{cache:'no-store'});if(!r.ok)return;const j=await r.json();const unread=(j.notifications||[]).filter((n:any)=>!(n.read||n.readAt));(navigator as any).setAppBadge?.(unread.length);if(first){known=new Set(unread.map((n:any)=>n.id));return}for(const n of unread){if(known.has(n.id))continue;known.add(n.id);if(Notification.permission==='granted'){const reg=await navigator.serviceWorker.ready;await reg.showNotification(n.title||'Nouvelle commande',{body:n.body||'Vous avez une nouvelle commande.',icon:'/icons/icon-192.png',badge:'/icons/icon-192.png',tag:`zelvora-${n.id}`,renotify:true,silent:false,vibrate:[300,150,300],data:{url:'/orders'}} as any)}}}catch{}};
  check(true);const timer=setInterval(()=>check(false),30000);return()=>{stopped=true;clearInterval(timer)};
 },[]);
 async function activate(){setBusy(true);try{const permission=await Notification.requestPermission();if(permission!=='granted')throw Error('Autorisation refusée. Activez les notifications dans les réglages du navigateur.');const publicKey=process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;if(!publicKey)throw Error('Clé VAPID publique absente.');const reg=await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:vapidKey(publicKey)});const r=await fetch('/api/push/subscribe',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(sub.toJSON())});const j=await r.json();if(!r.ok)throw Error(j.error);setEnabled(true);await reg.showNotification('Notifications Zelvora activées',{body:'Vous recevrez les nouvelles commandes avec le son système et un compteur.',icon:'/icons/icon-192.png',badge:'/icons/icon-192.png',silent:false,vibrate:[200,100,200],data:{url:'/orders'}} as any)}catch(e){alert(e instanceof Error?e.message:'Activation impossible.')}finally{setBusy(false)}}
 if(!ready||enabled)return null;return <button onClick={activate} disabled={busy} className="fixed bottom-5 right-5 z-50 rounded-full bg-violet px-5 py-3 text-sm font-black text-white shadow-2xl">{busy?'Activation…':'🔔 Activer les notifications'}</button>
}
