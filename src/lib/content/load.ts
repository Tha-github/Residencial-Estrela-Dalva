import { z } from 'zod';
import raw from '../../data/residencial.json';
import { residencialSchema, type Residencial } from './schema';

export class ContentValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Conteúdo do residencial inválido:\n${issues.map((i) => `  - ${i}`).join('\n')}`);
    this.name = 'ContentValidationError';
  }
}

/** Valida dados brutos contra o esquema e lança erro legível se algo estiver errado. */
export function parseContent(data: unknown): Residencial {
  const result = residencialSchema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues.map(
      (issue: z.core.$ZodIssue) => `${issue.path.join('.') || '(raiz)'}: ${issue.message}`,
    );
    throw new ContentValidationError(issues);
  }
  return result.data;
}

let cached: Residencial | undefined;

/**
 * Fonte única de conteúdo para as páginas.
 * Hoje: src/data/residencial.json. No Prompt 6 a fonte passa a ser o
 * conteúdo publicado pelo painel, sem alterar os componentes.
 * Um conteúdo inválido interrompe o build em vez de publicar algo quebrado.
 */
export function getContent(): Residencial {
  if (!cached) {
    const content = parseContent(raw);
    assertNoDevImages(content);
    cached = content;
  }
  return cached;
}

/** O conteúdo real nunca pode apontar para imagens de exemplo (src/assets/dev). */
export function assertNoDevImages(c: Residencial): void {
  const images = [c.hero.image, ...c.gallery].filter((i) => i !== null);
  const dev = images.filter((i) => i.src.startsWith('/dev/')).map((i) => i.src);
  if (dev.length > 0) {
    throw new ContentValidationError(dev.map((src) => `${src}: imagem de exemplo não pode ser usada no conteúdo real`));
  }
}
