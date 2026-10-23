import{NextRequest,NextResponse}from'next/server';
import{createSupabasePublicClient}from'@/lib/supabase/server';
import{expiredSupabaseSessionCookies,SUPABASE_ACCESS_COOKIE,SUPABASE_REFRESH_COOKIE,supabaseSessionCookies}from'@/lib/auth';
import{useSupabase}from'@/lib/supabase/config';
import{assertSameOrigin}from'@/lib/security';

export async function POST(request:NextRequest){
 try{assertSameOrigin(request);if(!useSupabase)return NextResponse.json({ok:true});const access=request.cookies.get(SUPABASE_ACCESS_COOKIE)?.value,refresh=request.cookies.get(SUPABASE_REFRESH_COOKIE)?.value,client=createSupabasePublicClient();if(access){const{data}=await client.auth.getClaims(access);if(data?.claims?.sub)return NextResponse.json({ok:true})}if(!refresh){const response=NextResponse.json({error:'Session expirée. Reconnectez-vous.'},{status:401});for(const cookie of expiredSupabaseSessionCookies())response.cookies.set(cookie.name,cookie.value,cookie.options);return response}const{data,error}=await client.auth.refreshSession({refresh_token:refresh});if(error||!data.session)throw Error('Session expirée. Reconnectez-vous.');const response=NextResponse.json({ok:true});for(const cookie of supabaseSessionCookies(data.session))response.cookies.set(cookie.name,cookie.value,cookie.options);return response}catch{const response=NextResponse.json({error:'Session expirée. Reconnectez-vous.'},{status:401});for(const cookie of expiredSupabaseSessionCookies())response.cookies.set(cookie.name,cookie.value,cookie.options);return response}
}
