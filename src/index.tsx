import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { CRITERIA } from './lib/criteria'
import { fetchStoreData } from './lib/smartstore'
import { diagnose } from './lib/engine'
import { renderHome } from './page'

const app = new Hono()

app.use('/api/*', cors())

/**
 * GET /api/store?url=...
 * 스마트스토어 공개 페이지에서 자동 수집한 데이터를 반환한다.
 * (체크리스트로 넘어가기 전, 상품을 식별하고 자동값을 미리 채우는 용도)
 */
app.get('/api/store', async (c) => {
  const url = c.req.query('url')
  if (!url) return c.json({ error: 'url 파라미터가 필요해요.' }, 400)
  try {
    const data = await fetchStoreData(url)
    return c.json(data)
  } catch (e: any) {
    return c.json({ error: e?.message || '수집 중 오류가 발생했어요.' }, 500)
  }
})

/**
 * POST /api/diagnose
 * body: { url?: string, store?: StoreData, answers: { [key]: number } }
 * 자동 수집 데이터 + 체크리스트 응답을 통합해 진단 결과를 반환한다.
 */
app.post('/api/diagnose', async (c) => {
  try {
    const body = await c.req.json()
    const answers: Record<string, number> = body.answers || {}

    let store = body.store
    if (!store && body.url) {
      store = await fetchStoreData(body.url)
    }
    if (!store) {
      // URL도 store도 없으면 빈 store로 체크리스트만 진단
      store = {
        productId: '-',
        storeName: null,
        name: body.name || '',
        nameLength: (body.name || '').length,
        category: null,
        price: null,
        imageUrl: null,
        imageCount: null,
        reviewCount: null,
        starRating: null,
        collected: [],
        notes: ['URL 없이 체크리스트로만 진단했어요.'],
      }
    }

    const result = diagnose(store, answers)
    return c.json(result)
  } catch (e: any) {
    return c.json({ error: e?.message || '진단 중 오류가 발생했어요.' }, 500)
  }
})

/** GET /api/criteria — 진단 항목 정의(프론트 체크리스트 렌더용) */
app.get('/api/criteria', (c) => c.json(CRITERIA))

/** 메인 페이지 (3단계 SPA) */
app.get('/', (c) => c.html(renderHome()))

export default app
