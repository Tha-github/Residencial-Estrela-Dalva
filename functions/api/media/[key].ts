import type { Env } from '../admin/_lib';
export const onRequestGet: PagesFunction<Env> = async ({params,env}) => {
  const key=String(params.key);
  const missing=()=>new Response('Not found',{status:404,headers:{'cache-control':'no-store','content-security-policy':"default-src 'none'; frame-ancestors 'none'",'strict-transport-security':'max-age=31536000','x-content-type-options':'nosniff','x-frame-options':'DENY','referrer-policy':'strict-origin-when-cross-origin','permissions-policy':'camera=(), microphone=(), geolocation=(), payment=()'}});
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(key)) return missing();
  const object=await env.MEDIA.get(key); if (!object) return missing();
  const headers=new Headers(); object.writeHttpMetadata(headers); headers.set('etag',object.httpEtag); headers.set('x-content-type-options','nosniff'); headers.set('cache-control','public, max-age=31536000, immutable');
  headers.set('content-security-policy',"default-src 'none'; sandbox; frame-ancestors 'none'");
  headers.set('strict-transport-security','max-age=31536000');
  headers.set('x-frame-options','DENY');
  headers.set('referrer-policy','strict-origin-when-cross-origin');
  headers.set('permissions-policy','camera=(), microphone=(), geolocation=(), payment=()');
  headers.set('content-disposition',`inline; filename="${key}"`);
  return new Response(object.body,{headers});
};
