import { authorized, json, rateLimit, sameOrigin, type Env } from './_lib';
export const onRequestPost: PagesFunction<Env> = async ({request,env}) => {
  if(!sameOrigin(request))return json({error:'Origem inválida.'},403);
  const denied = await authorized(request,env); if (denied) return denied;
  const limited=await rateLimit(request,env,12); if(limited)return limited;
  return json({logout:true, url:`https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/logout`});
};
