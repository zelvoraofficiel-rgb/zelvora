import { NextRequest } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { getAnalysisProvider } from '@/lib/ai';
import { apiError, assertSameOrigin, rateLimit } from '@/lib/security';

const bodySchema = z.object({
  source: z.enum(['LINK', 'IMAGE', 'MANUAL']),
  name: z.string().trim().max(140).optional(),
  description: z.string().trim().max(3000).optional(),
  url: z.string().url('Lien invalide.').max(2048).optional()
}).superRefine((value, ctx) => {
  if (value.source === 'LINK' && !value.url) ctx.addIssue({ code: 'custom', path: ['url'], message: 'Collez le lien de votre produit.' });
  if (value.source === 'MANUAL' && !value.name) ctx.addIssue({ code: 'custom', path: ['name'], message: 'Indiquez le nom du produit.' });
});

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request); rateLimit(request, 'analysis', 15);
    if (!await currentUser()) throw new Error('Utilisateur non authentifié.');
    const input = bodySchema.parse(await request.json());
    const analysis = await getAnalysisProvider().analyze(input);
    return Response.json({ analysis, provider: process.env.AI_PROVIDER || 'demo', requiresReview: true });
  } catch (error) { return apiError(error); }
}
