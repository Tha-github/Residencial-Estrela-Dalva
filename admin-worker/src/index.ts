/**
 * Worker do painel do Residencial Estrela Dalva.
 * Configuração: admin-worker/wrangler.jsonc (D1 e variáveis) + secrets
 * (PROVISIONING_KEY, CONFIG_ENCRYPTION_KEY, SESSION_SECRET).
 */
import { estrelaDalvaSpec } from '../../src/admin-sites/estrela-dalva';
import { residencialSchema } from '../../src/lib/content/schema';
import { handle, type Env, type SiteAdapter } from './app';

const site: SiteAdapter = {
  id: 'residencial-estrela-dalva',
  spec: estrelaDalvaSpec,
  validate(content) {
    const result = residencialSchema.safeParse(content);
    return result.success
      ? []
      : result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
  },
};

export default {
  fetch: (request: Request, env: Env) => handle(request, env, site),
};
