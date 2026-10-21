'use client';
/** Shrinks large photos before upload to keep storefronts fast on mobile networks. */
export async function optimizeImage(file:File,maxSide=1600):Promise<File>{
 if(!file.type.startsWith('image/')||file.size<350_000)return file;
 const bitmap=await createImageBitmap(file),scale=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height));
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
 const context=canvas.getContext('2d',{alpha:false});if(!context){bitmap.close();return file}context.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
 const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/webp',.82));
 if(!blob||blob.size>=file.size)return file;
 return new File([blob],file.name.replace(/\.[^.]+$/,'.webp'),{type:'image/webp',lastModified:Date.now()});
}
