import { lookup } from 'node:dns/promises';
import type { ProductAnalysis } from '@/lib/types';

export type AnalysisInput = { source: 'LINK' | 'IMAGE' | 'MANUAL'; name?: string; description?: string; url?: string };
export interface ProductAnalysisProvider { analyze(input: AnalysisInput): Promise<ProductAnalysis>; }
type Metadata = { title?: string; description?: string };

function decodeHtml(value: string) { return value.replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>'); }
function firstMatch(html: string, expressions: RegExp[]) { for (const expression of expressions) { const match = expression.exec(html); if (match?.[1]) return decodeHtml(match[1].replace(/\s+/g, ' ').trim()); } return undefined; }
function privateAddress(address: string) {
  const value = address.toLowerCase();
  if (value.includes(':')) return value === '::1' || value.startsWith('fc') || value.startsWith('fd') || value.startsWith('fe80:') || value.startsWith('::ffff:');
  const [a, b] = value.split('.').map(Number); return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}
async function textWithinLimit(response: Response, maxBytes = 600_000) {
  if (!response.body) return ''; const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > maxBytes) { await reader.cancel(); throw new Error('La page est trop volumineuse.'); } chunks.push(value); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; } return new TextDecoder().decode(bytes);
}

/** Fetches only public HTTPS HTML metadata. It does not follow redirects or scrape private networks. */
async function extractPublicMetadata(rawUrl: string): Promise<Metadata | null> {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:') return null;
    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal') || /^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return null;
    const addresses = await lookup(host, { all: true, verbatim: true });
    if (!addresses.length || addresses.some(({ address }) => privateAddress(address))) return null;
    const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(5000), headers: { accept: 'text/html,application/xhtml+xml', 'user-agent': 'ZelvoraProductImport/0.1' } });
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) return null;
    const length = Number(response.headers.get('content-length') || 0); if (length > 600_000) return null;
    const html = await textWithinLimit(response);
    return {
      title: firstMatch(html, [/<meta[^>]+(?:property|name)=["'](?:og:title|twitter:title)["'][^>]+content=["']([^"']+)["'][^>]*>/i, /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:title|twitter:title)["'][^>]*>/i, /<title[^>]*>([^<]+)<\/title>/i]),
      description: firstMatch(html, [/<meta[^>]+(?:property|name)=["'](?:og:description|description)["'][^>]+content=["']([^"']+)["'][^>]*>/i, /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:description|description)["'][^>]*>/i])
    };
  } catch { return null; }
}

/** Safe local fallback. It only reformulates merchant-provided or public page metadata and marks every unknown as needing review. */
export class DemoSafeAnalysisProvider implements ProductAnalysisProvider {
  async analyze(input: AnalysisInput): Promise<ProductAnalysis> {
    const metadata = input.source === 'LINK' && input.url ? await extractPublicMetadata(input.url) : null;
    const name = input.name?.trim() || metadata?.title || (input.source === 'LINK' ? 'Produit importé — nom à confirmer' : 'Produit à identifier');
    const description = input.description?.trim() || metadata?.description || 'Information non trouvée — à compléter par le marchand.';
    const sourceHint = input.source === 'LINK' ? metadata ? 'Métadonnées publiques du lien importées : vérifiez leur exactitude.' : 'Lien fourni, mais aucune métadonnée publique exploitable n’a été extraite.' : input.source === 'IMAGE' ? 'Image fournie : les informations produit restent à vérifier.' : 'Informations saisies par le marchand.';
    return {
      name,
      commercialTitle: name,
      description,
      benefits: ['Bénéfice principal — à compléter', 'Argument de réassurance — à vérifier', 'Information livraison — à compléter'],
      category: 'Catégorie à définir',
      faq: [
        { question: 'Quelles sont les caractéristiques du produit ?', answer: 'Information non trouvée — à compléter.', confidence: 'needs_review' },
        { question: 'Comment se déroule la livraison ?', answer: 'Information non trouvée — à compléter.', confidence: 'needs_review' }
      ],
      missingInformation: ['Prix de vente', 'Caractéristiques techniques', 'Stock disponible', 'Livraison et retours'],
      notice: `${sourceHint} Aucune certification, performance, garantie ou donnée technique n’a été inventée.`
    };
  }
}

export function getAnalysisProvider(): ProductAnalysisProvider {
  // Provider boundary intentionally isolated. Add an approved external provider behind this interface.
  return new DemoSafeAnalysisProvider();
}
