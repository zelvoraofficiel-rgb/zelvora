import webpush from 'web-push';
import{createClient}from'@supabase/supabase-js';
import{supabaseServiceRoleKey,supabaseUrl}from'@/lib/supabase/config';

type OrderPush={orderKey:string;title:string;body:string;url:string};
let configured=false;
function configure(){if(configured)return true;const pub=process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,priv=process.env.VAPID_PRIVATE_KEY,subject=process.env.VAPID_SUBJECT;if(!pub||!priv||!subject)return false;webpush.setVapidDetails(subject,pub,priv);configured=true;return true}
export async function sendOrderPush(storeId:string,payload:OrderPush){
 if(!configure()||!supabaseUrl||!supabaseServiceRoleKey)return {sent:0,skipped:true};
 const admin=createClient(supabaseUrl,supabaseServiceRoleKey,{auth:{persistSession:false}});
 const{data:subs,error}=await admin.from('push_subscriptions').select('id,endpoint,p256dh,auth,sound_enabled').eq('store_id',storeId);
 if(error)throw error;let sent=0;
 await Promise.allSettled((subs||[]).map(async(s:any)=>{
  const{error:reserve}=await admin.from('push_delivery_log').insert({order_key:payload.orderKey,subscription_id:s.id});
  if(reserve){if(reserve.code==='23505')return;throw reserve}
  try{
   await webpush.sendNotification({endpoint:s.endpoint,keys:{p256dh:s.p256dh,auth:s.auth}},JSON.stringify({title:payload.title,body:payload.body,url:payload.url,tag:`order-${payload.orderKey}`,sound:Boolean(s.sound_enabled)}),{TTL:300,urgency:'high',topic:`order-${payload.orderKey}`.slice(0,32)});
   sent++;await admin.from('push_subscriptions').update({last_success_at:new Date().toISOString(),last_error:null,updated_at:new Date().toISOString()}).eq('id',s.id);
  }catch(e:any){const status=Number(e?.statusCode||e?.status);if(status===404||status===410){await admin.from('push_subscriptions').delete().eq('id',s.id)}else{await admin.from('push_delivery_log').delete().eq('order_key',payload.orderKey).eq('subscription_id',s.id);await admin.from('push_subscriptions').update({last_error:String(e?.message||'Échec Web Push').slice(0,500),updated_at:new Date().toISOString()}).eq('id',s.id)}}
 }));
 return{sent,skipped:false};
}
