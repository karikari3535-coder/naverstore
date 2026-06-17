import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import { DEMO_HTML } from './demoHtml'

const app = new Hono()

// 정적 에셋 (필요 시) — /static/* 경로
app.use('/static/*', serveStatic({ root: './' }))

// 헬스체크
app.get('/healthz', (c) => c.text('ok'))

// 셀러랩스 상품명 추천기 — 독립 데모 (자체 완결 HTML)
app.get('/', (c) => c.html(DEMO_HTML))

// 그 외 모든 경로는 데모로 폴백
app.notFound((c) => c.html(DEMO_HTML))

export default app
