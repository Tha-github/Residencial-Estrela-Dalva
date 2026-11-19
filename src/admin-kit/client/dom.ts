/**
 * Inserção de nós via `appendChild`/`insertBefore` (API de Node).
 * Evita `Element.append/prepend`, cujos tipos colidem com os do runtime do
 * Cloudflare (worker-configuration.d.ts) presentes no mesmo projeto.
 */
export type Kid = Node | string | null | undefined | false;

const node = (k: Node | string) => (typeof k === 'string' ? document.createTextNode(k) : k);

export function add<T extends Node>(parent: T, ...kids: Kid[]): T {
  for (const k of kids)
    if (k !== null && k !== undefined && k !== false) parent.appendChild(node(k));
  return parent;
}

/**
 * Executa `load` só quando o elemento chega perto da tela (fotos do painel
 * são originais grandes: baixar todas de uma vez deixaria tudo lento).
 */
export function whenVisible(el: Element, load: () => void) {
  if (!('IntersectionObserver' in window)) return load();
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        load();
      }
    },
    { rootMargin: '300px' },
  );
  io.observe(el);
}

/** Fila simples: no máximo `limit` tarefas ao mesmo tempo. */
export function queue(limit: number) {
  let running = 0;
  const waiting: (() => void)[] = [];
  const next = () => {
    if (running >= limit) return;
    const job = waiting.shift();
    if (!job) return;
    running++;
    job();
  };
  return <T>(task: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      waiting.push(() =>
        task()
          .then(resolve, reject)
          .finally(() => {
            running--;
            next();
          }),
      );
      next();
    });
}

export function addFirst<T extends Node>(parent: T, ...kids: Kid[]): T {
  const first = parent.firstChild;
  for (const k of kids)
    if (k !== null && k !== undefined && k !== false) parent.insertBefore(node(k), first);
  return parent;
}
