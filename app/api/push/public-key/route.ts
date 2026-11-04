import{apiError}from'@/lib/security';
export async function GET(){try{const publicKey=process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;if(!publicKey)throw Error('Clé VAPID publique non configurée.');return Response.json({publicKey},{headers:{'Cache-Control':'public, max-age=3600'}})}catch(e){return apiError(e)}}
