import { authorized, getContent, json, rateLimit, sameOrigin, type Env } from './_lib';
import { residencialSchema } from '../../../src/lib/content/schema';
import type { Residencial } from '../../../src/lib/content/schema';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const denied = await authorized(request, env); if (denied) return denied;
  const limited=await rateLimit(request,env,60); if(limited)return limited;
  return json(await getContent(env));
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  if(!sameOrigin(request))return json({error:'Origem inválida.'},403);
  const denied = await authorized(request, env); if (denied) return denied;
  const limited=await rateLimit(request,env,12); if(limited)return limited;
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') return json({error:'Formato inválido.'},415);
  const raw = await request.text(); if (raw.length > 100_000) return json({error:'Conteúdo excede o limite.'},413);
  let input: unknown; try { input = JSON.parse(raw); } catch { return json({error:'JSON inválido.'},400); }
  const parsed = residencialSchema.safeParse(input); if (!parsed.success) return json({error:'Revise os campos informados.', fields:parsed.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`)},400);
  const current = await getContent(env) as Residencial, next = parsed.data as Residencial;
  // Identidade e estrutura geral são fixas. O painel não altera nome, localização, nem cria grupos/campos.
  if (next.name !== current.name || next.location.beach !== current.location.beach || next.location.city !== current.location.city || next.location.state !== current.location.state || next.location.stateCode !== current.location.stateCode || next.location.address !== current.location.address || next.highlights.length !== current.highlights.length || next.highlights.some((h,i)=>h.icon!==current.highlights[i]?.icon)) return json({error:'Campo fora do escopo editável.'},400);
  const clean = (value: unknown): boolean => {
    if(typeof value==='string'){
      if(value.length>2048||/[<>]/.test(value))return false;
      for(const char of value){const code=char.codePointAt(0)??0;if((code<0x20&&code!==9&&code!==10&&code!==13)||code===0x7f)return false;}
      return true;
    }
    return Array.isArray(value)?value.every(clean):value!==null&&typeof value==='object'?Object.values(value).every(clean):true;
  };
  if (!clean(next)) return json({error:'Textos devem ser simples, sem HTML ou caracteres de controle.'},400);
  await env.CONTENT.prepare('UPDATE content SET body = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(JSON.stringify(next),'estrela-dalva').run();
  try {
    const hook = await fetch(env.DEPLOY_HOOK_URL,{method:'POST'});
    if (!hook.ok) return json({saved:true, warning:'Conteúdo salvo. A publicação automática falhou; contate o suporte.'},202);
  } catch { return json({saved:true, warning:'Conteúdo salvo. A publicação automática falhou; contate o suporte.'},202); }
  return json({saved:true});
};
