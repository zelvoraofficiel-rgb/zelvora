'use client';
import{useEffect,useState}from'react';

export function NotificationCount({initial=0,className=''}:{initial?:number;className?:string}){
 const[count,setCount]=useState(initial);
 useEffect(()=>{
  const update=(event:Event)=>setCount(Number((event as CustomEvent).detail)||0);
  window.addEventListener('zelvora:unread',update);
  return()=>window.removeEventListener('zelvora:unread',update);
 },[]);
 if(count<1)return null;
 return <span className={`inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-black leading-4 text-white ${className}`} aria-label={`${count} commande${count>1?'s':''} non lue${count>1?'s':''}`}>{count>99?'99+':count}</span>;
}
