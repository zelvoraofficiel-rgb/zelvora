import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword, sessionCookie, supabaseSessionCookies } from '@/lib/auth';
import { id, mutateDb, now, slugify, uniqueSlug } from '@/lib/db';
import { apiError, assertSameOrigin, rateLimit } from '@/lib/security';
import { createSupabasePublicClient } from '@/lib/supabase/server';
import { ensureOrganization } from '@/lib/supabase/data';
import { useSupabase } from '@/lib/supabase/config';
import { authErrorFr } from '@/lib/auth-errors';

const bodySchema = z.object({ firstName:z.string().trim().min(1,'Indiquez votre prénom.').max(60),lastName:z.string().trim().min(1,'Indiquez votre nom.').max(60),countryCode:z.string().regex(/^[A-Z]{2}$/,'Choisissez votre pays.'),acceptedTerms:z.literal(true,{errorMap:()=>({message:'Acceptez les conditions d’utilisation.'})}), email: z.string().trim().email('Adresse email invalide.').max(254).transform((value) => value.toLowerCase()), password: z.string().min(10, 'Le mot de passe doit comporter au moins 10 caractères.').regex(/[A-Z]/,'Ajoutez une majuscule.').regex(/[0-9]/,'Ajoutez un chiffre.').max(128) }).transform(v=>({...v,name:`${v.firstName} ${v.lastName}`.trim()}));
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request); rateLimit(request, 'register', 5); const input = bodySchema.parse(await request.json());
    if (useSupabase) {
      const supabase = createSupabasePublicClient(); const { data, error } = await supabase.auth.signUp({ email: input.email, password: input.password, options: { data: { name: input.name,first_name:input.firstName,last_name:input.lastName,country_code:input.countryCode } } });
      if (error) throw new Error(authErrorFr(error.message,'Création du compte impossible.'));
      if (!data.user) throw new Error('Création du compte impossible.');
      if(Array.isArray(data.user.identities)&&data.user.identities.length===0)throw new Error('Cette adresse e-mail est déjà utilisée. Connectez-vous ou utilisez une autre adresse.');
      if (!data.session) return NextResponse.json({ user: { id: data.user.id, name: input.name, email: input.email }, confirmationRequired: true }, { status: 201 });
      await ensureOrganization({ id: data.user.id, email: input.email, name: input.name, accessToken: data.session.access_token });
      const response = NextResponse.json({ user: { id: data.user.id, name: input.name, email: input.email } }, { status: 201 });
      for (const cookie of supabaseSessionCookies(data.session)) response.cookies.set(cookie.name, cookie.value, cookie.options);
      return response;
    }
    const passwordHash = await hashPassword(input.password);
    const user = await mutateDb((db) => { if (db.users.some((item) => item.email === input.email)) throw new Error('Un compte existe déjà pour cet email.'); const createdAt = now(); const user = { id: id(), name: input.name, email: input.email, passwordHash, createdAt }; const orgName = `${input.name.split(' ')[0] || 'Ma'} entreprise`; db.users.push(user); db.organizations.push({ id: id(), userId: user.id, name: orgName, slug: uniqueSlug(db.organizations.map((item) => item.slug), slugify(orgName)), createdAt }); return user; });
    const response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } }, { status: 201 }); const cookie = sessionCookie(user.id); response.cookies.set(cookie.name, cookie.value, cookie.options); return response;
  } catch (error) { return apiError(error); }
}
