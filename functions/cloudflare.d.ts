interface D1Result<T = unknown> { results: T[]; success: boolean; meta: Record<string, unknown> }
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(column?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
}
interface D1Database { prepare(query: string): D1PreparedStatement }
interface R2ObjectBody { body: ReadableStream; httpEtag: string; writeHttpMetadata(headers: Headers): void }
interface R2Bucket {
  put(key: string, value: ArrayBuffer | ArrayBufferView | ReadableStream, options?: { httpMetadata?: Record<string, string> }): Promise<unknown>;
  get(key: string): Promise<R2ObjectBody | null>;
}
interface PagesFunction<Env = unknown> {
  (context: { request: Request; env: Env; params: Record<string, string>; waitUntil(promise: Promise<unknown>): void }): Response | Promise<Response>;
}
