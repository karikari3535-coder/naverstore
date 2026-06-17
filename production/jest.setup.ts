// ── Web API 폴리필 (Next.js Route Handler / MSW v2 용) ──
// Node 20+ 에는 fetch/Request/Response 가 글로벌로 있지만,
// jsdom 환경 등에서 누락될 수 있어 명시적으로 보강한다.
import { TextEncoder, TextDecoder } from 'util';
Object.assign(global, { TextEncoder, TextDecoder });

// jsdom 환경에는 ReadableStream/TransformStream 이 없어 undici 가 깨진다.
// node:stream/web 에서 끌어와 먼저 폴리필한다.
try {
  const webStreams = require('node:stream/web');
  for (const k of ['ReadableStream', 'WritableStream', 'TransformStream'] as const) {
    if (typeof (global as any)[k] === 'undefined' && webStreams[k]) {
      (global as any)[k] = webStreams[k];
    }
  }
  if (typeof (global as any).MessagePort === 'undefined') {
    (global as any).MessagePort = require('node:worker_threads').MessagePort;
  }
} catch {
  /* node 버전에 따라 없을 수 있음 — 무시 */
}

if (typeof (global as any).fetch === 'undefined') {
  try {
    const { fetch, Request, Response, Headers } = require('undici');
    Object.assign(global, { fetch, Request, Response, Headers });
  } catch {
    /* fetch 가 필요 없는 테스트(jsdom 단위 테스트)에서는 무시 */
  }
}

// ── MSW 모킹 서버 ──
import { server } from './src/test/mswServer';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
