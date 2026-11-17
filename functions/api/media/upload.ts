import { authorized, json, rateLimit, sameOrigin, type Env } from '../admin/_lib';
const MAX_UPLOAD = 13 * 1024 * 1024;

function validImageContainer(bytes: Uint8Array, type: string): boolean {
  if (type === 'image/png') {
    if(bytes.length<33)return false;
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    if (signature.some((value, index) => bytes[index] !== value)) return false;
    if (new TextDecoder().decode(bytes.slice(12, 16)) !== 'IHDR' || bytes[8] !== 0 || bytes[9] !== 0 || bytes[10] !== 0 || bytes[11] !== 13) return false;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const width = view.getUint32(16), height = view.getUint32(20);
    if(width === 0||height===0||width>12_000||height>12_000||width*height>40_000_000)return false;
    let index=8,sawData=false,ended=false;
    while(index+12<=bytes.length){
      const size=view.getUint32(index),kind=new TextDecoder().decode(bytes.slice(index+4,index+8));
      if(size>bytes.length-index-12||kind==='acTL')return false;
      if(kind==='IDAT')sawData=true;
      index+=12+size;
      if(kind==='IEND'){if(size!==0)return false;ended=true;break;}
    }
    return sawData&&ended&&index===bytes.length;
  }
  if (type === 'image/webp') {
    if(bytes.length<20)return false;
    if (new TextDecoder().decode(bytes.slice(0, 4)) !== 'RIFF' || new TextDecoder().decode(bytes.slice(8, 12)) !== 'WEBP') return false;
    if (new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(4, true) !== bytes.length - 8) return false;
    const chunk = new TextDecoder().decode(bytes.slice(12, 16));
    const chunkSize = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(16, true);
    if(chunkSize>bytes.length-20)return false;
    let width: number, height: number;
    if (chunk === 'VP8X' && chunkSize===10 && bytes.length >= 30) {
      if ((bytes[20]! & 0x02) !== 0) return false;
      width = 1 + (bytes[24]! | (bytes[25]! << 8) | (bytes[26]! << 16));
      height = 1 + (bytes[27]! | (bytes[28]! << 8) | (bytes[29]! << 16));
    } else if (chunk === 'VP8 ' && chunkSize>=10 && bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
      width = ((bytes[27]! << 8) | bytes[26]!) & 0x3fff;
      height = ((bytes[29]! << 8) | bytes[28]!) & 0x3fff;
    } else if (chunk === 'VP8L' && chunkSize>=5 && bytes.length >= 25 && bytes[20] === 0x2f) {
      const b1 = bytes[21]!, b2 = bytes[22]!, b3 = bytes[23]!, b4 = bytes[24]!;
      width = 1 + (((b2 & 0x3f) << 8) | b1);
      height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
    } else return false;
    return width > 0 && height > 0 && width <= 12_000 && height <= 12_000 && width * height <= 40_000_000;
  }
  if (type === 'image/jpeg') {
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9) return false;
    const read16 = (index: number) => (bytes[index]! << 8) | bytes[index + 1]!;
    let index = 2, foundDimensions = false;
    while (index + 4 < bytes.length) {
      if (bytes[index] !== 0xff) return false;
      while (bytes[index] === 0xff) index++;
      const marker = bytes[index++]!;
      if (marker === 0xda) return foundDimensions;
      if (marker === 0xd9) return false;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      const length = read16(index);
      if (length < 2 || index + length > bytes.length) return false;
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
        if(length<8)return false;
        const height = read16(index + 3), width = read16(index + 5);
        if(width===0||height===0||width>12_000||height>12_000||width*height>40_000_000)return false;
        foundDimensions=true;
      }
      index += length;
    }
  }
  return false;
}

export const onRequestPost: PagesFunction<Env> = async ({request,env}) => {
  if(!sameOrigin(request))return json({error:'Origem inválida.'},403);
  const denied = await authorized(request,env); if (denied) return denied;
  const limited=await rateLimit(request,env,12); if(limited)return limited;
  const contentType=request.headers.get('content-type');
  if(!contentType?.toLowerCase().startsWith('multipart/form-data;'))return json({error:'Envie um formulário de arquivo válido.'},415);
  const length=Number(request.headers.get('content-length')||0);
  if(length>MAX_UPLOAD)return json({error:'Envie uma imagem de até 12 MB.'},413);
  if (!request.body) return json({error:'Arquivo inválido.'},400);
  const reader=request.body.getReader(),chunks:Uint8Array[]=[];let total=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>MAX_UPLOAD){await reader.cancel();return json({error:'Envie uma imagem de até 12 MB.'},413);}chunks.push(value);}}
  catch{return json({error:'Não foi possível ler o arquivo.'},400);}
  const body=new Uint8Array(total);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}
  const multipartHeaders=new Headers({'content-type':contentType});
  let form:FormData;try{form=await new Request(request.url,{method:'POST',headers:multipartHeaders,body}).formData();}catch{return json({error:'Envie um formulário de arquivo válido.'},400);}
  const file = form.get('file');
  if (!(file instanceof File) || file.size < 16 || file.size > 12 * 1024 * 1024) return json({error:'Envie uma imagem de até 12 MB.'},413);
  const ext = file.name.toLowerCase().split('.').pop();
  const bytes = new Uint8Array(await file.arrayBuffer());
  let type = '';
  if (bytes[0]===0xff && bytes[1]===0xd8 && bytes[2]===0xff) type='image/jpeg';
  if (bytes[0]===0x89 && new TextDecoder().decode(bytes.slice(1,4))==='PNG') type='image/png';
  if (new TextDecoder().decode(bytes.slice(0,4))==='RIFF' && new TextDecoder().decode(bytes.slice(8,12))==='WEBP') type='image/webp';
  if (!type || file.type !== type || (type==='image/jpeg'&&!['jpg','jpeg'].includes(ext||'')) || (type==='image/png'&&ext!=='png') || (type==='image/webp'&&ext!=='webp')) return json({error:'Arquivo, extensão ou tipo de imagem inválido.'},415);
  if (!validImageContainer(bytes,type)) return json({error:'Imagem truncada, inválida ou com dimensões excessivas.'},415);
  const key = `${crypto.randomUUID()}.${type==='image/jpeg'?'jpg':type.split('/')[1]}`;
  await env.MEDIA.put(key,bytes,{httpMetadata:{contentType:type,cacheControl:'public, max-age=31536000, immutable'}});
  return json({src:`/api/media/${key}`});
};
