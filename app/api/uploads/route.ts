import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { apiError, assertSameOrigin, rateLimit } from '@/lib/security';
import { clientFor, fail } from '@/lib/supabase/data';
import { useSupabase } from '@/lib/supabase/config';
const allowed = new Map([['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/webp', 'webp']]);
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request); rateLimit(request, 'upload', 12); const user = await currentUser(); if (!user) throw new Error('Utilisateur non authentifié.'); const form = await request.formData(); const file = form.get('file');
    if (!(file instanceof File)) throw new Error('Sélectionnez une image JPG, PNG ou WEBP.'); const extension = allowed.get(file.type); if (!extension) throw new Error('Format non accepté. Utilisez JPG, PNG ou WEBP.'); if (file.size < 1 || file.size > 5 * 1024 * 1024) throw new Error('L’image doit faire entre 1 octet et 5 Mo.');
    if (useSupabase && user.accessToken) {
      const client = clientFor(user); const storagePath = `${user.id}/${randomUUID()}.${extension}`; const { error: uploadError } = await client.storage.from('store-assets').upload(storagePath, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false }); if (uploadError) fail(uploadError, 'Téléversement Supabase impossible.');
      const { data: publicData } = client.storage.from('store-assets').getPublicUrl(storagePath); const { error: fileError } = await client.from('files').insert({ owner_id: user.id, storage_path: storagePath, public_url: publicData.publicUrl, mime_type: file.type, size_bytes: file.size }); if (fileError) { await client.storage.from('store-assets').remove([storagePath]); fail(fileError, 'Impossible d’enregistrer le fichier.'); }
      return Response.json({ url: publicData.publicUrl, storage: 'supabase' }, { status: 201 });
    }
    const uploadDir = path.join(process.cwd(), 'public', 'uploads'); await mkdir(uploadDir, { recursive: true }); const name = `${randomUUID()}.${extension}`; await writeFile(path.join(uploadDir, name), Buffer.from(await file.arrayBuffer())); return Response.json({ url: `/uploads/${name}`, storage: 'local-development' }, { status: 201 });
  } catch (error) { return apiError(error); }
}
