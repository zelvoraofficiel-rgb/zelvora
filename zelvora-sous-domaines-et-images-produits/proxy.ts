import{NextRequest,NextResponse}from'next/server';
import{createClient}from'@supabase/supabase-js';

const ACCESS='zelvora_sb_access',REFRESH='zelvora_sb_refresh';
const protectedPages=['/dashboard','/products','/orders','/clients','/analytics','/analysis','/studio','/settings','/subscription','/team','/notifications','/admin','/explore','/marketing','/onboarding'];
function expiresSoon(token:string){try{const payload=JSON.parse(Buffer.from(token.split('.')[1]||'','base64url').toString());return !payload.exp||payload.exp*1000<Date.now()+120_000}catch{return true}}
function cookieOptions(maxAge:number){return{httpOnly:true,sameSite:'lax' as const,secure:process.env.NODE_ENV==='production',path:'/',maxAge}}
export async function proxy(request:NextRequest){
 const host=(request.headers.get('host')||'').split(':')[0].toLowerCase(),parts=host.split('.'),isZelvoraSubdomain=parts.length===3&&parts[1]==='zelvora'&&parts[2]==='net'&&!['www','app','api'].includes(parts[0]);
 if(isZelvoraSubdomain){const slug=parts[0],path=request.nextUrl.pathname;if(path==='/'||path===''){const url=request.nextUrl.clone();url.pathname=`/store/${slug}`;return NextResponse.rewrite(url)}if(path.startsWith('/product/')){const url=request.nextUrl.clone();url.pathname=`/store/${slug}${path}`;return NextResponse.rewrite(url)}}
 const isProtected=protectedPages.some(path=>request.nextUrl.pathname===path||request.nextUrl.pathname.startsWith(path+'/'));
 const access=request.cookies.get(ACCESS)?.value,refresh=request.cookies.get(REFRESH)?.value;
 if(refresh&&(!access||expiresSoon(access))){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(url&&key){const{data,error}=await createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}).auth.refreshSession({refresh_token:refresh});if(!error&&data.session){request.cookies.set(ACCESS,data.session.access_token);request.cookies.set(REFRESH,data.session.refresh_token);const response=NextResponse.next({request});response.cookies.set(ACCESS,data.session.access_token,cookieOptions(Math.max(60,data.session.expires_in||3600)));response.cookies.set(REFRESH,data.session.refresh_token,cookieOptions(30*86400));return response}const response=isProtected?NextResponse.redirect(new URL('/login?reason=session',request.url)):NextResponse.next();response.cookies.set(ACCESS,'',cookieOptions(0));response.cookies.set(REFRESH,'',cookieOptions(0));return response}
 }
 if(isProtected&&!access&&!refresh)return NextResponse.redirect(new URL('/login',request.url));
 return NextResponse.next();
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|icons/|images/|sw.js|manifest.webmanifest).*)']};
