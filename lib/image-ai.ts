export type ImageOperation='REMOVE_BACKGROUND'|'ENHANCE'|'PRODUCT_VISUAL'|'AD_VISUAL'|'SQUARE'|'VERTICAL'|'SOCIAL';
export type ImageJob={sourceUrl:string;operation:ImageOperation;prompt?:string};
export type ImageResult={status:'UNAVAILABLE'|'QUEUED'|'SUCCEEDED'|'FAILED';url?:string;message:string};
export interface ImageAiProvider{generate(job:ImageJob):Promise<ImageResult>}
class UnconfiguredImageProvider implements ImageAiProvider{async generate():Promise<ImageResult>{return{status:'UNAVAILABLE',message:"Aucun fournisseur d'image IA n’est configuré. Ajoutez IMAGE_AI_PROVIDER et IMAGE_AI_API_KEY côté serveur."}}}
export function imageAiProvider():ImageAiProvider{const provider=process.env.IMAGE_AI_PROVIDER||'none';if(provider==='none')return new UnconfiguredImageProvider();throw new Error(`Le fournisseur image « ${provider} » n’est pas implémenté. Aucun appel fictif n’a été exécuté.`)}
