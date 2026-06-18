import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { DEMO_HTML } from './demoHtml'
import { searchShop, extractKeywordFreq, extractCategory, avgPrice } from './lib/naverShop'
import { scoreKeywords, buildProductName, calcDifficulty, verdictOf } from './lib/recommender'

type Bindings = {
  NAVER_SHOP_ID?: string
  NAVER_SHOP_SECRET?: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

// 헬스체크
app.get('/healthz', (c) => c.text('ok'))

// API 키 설정 여부 (프론트가 실데이터 모드인지 판단용 — 키 값은 노출 안 함)
app.get('/api/status', (c) => {
  const ok = !!(c.env.NAVER_SHOP_ID && c.env.NAVER_SHOP_SECRET)
  return c.json({ liveData: ok })
})

/**
 * GET /api/analyze?kw=신안새우&brand=...&volume=...
 * 네이버 쇼핑 상위 40개를 분석해 추천 상품명/카테고리/키워드/난이도를 반환.
 */
app.get('/api/analyze', async (c) => {
  const kw = (c.req.query('kw') || '').trim()
  const brand = (c.req.query('brand') || '').trim()
  const volume = (c.req.query('volume') || '').trim()
  if (!kw) return c.json({ error: '키워드(kw)가 필요해요.' }, 400)

  try {
    const shop = await searchShop(kw, c.env, 40)
    const freqKws = extractKeywordFreq(shop.items, kw)

    if (!freqKws.length) {
      return c.json({
        error: '상위 상품에서 추출할 키워드가 부족해요. 더 일반적인 키워드로 시도해보세요.',
        total: shop.total,
      }, 422)
    }

    const ranked = scoreKeywords(freqKws.map(k => ({ word: k.word, freq: k.freq })))
    const name = buildProductName(kw, ranked, { brand, volume })
    const usedWords = name.split(' ')
    const category = extractCategory(shop.items)
    const difficulty = calcDifficulty({ totalProducts: shop.total, avgPrice: avgPrice(shop.items) })
    const v = verdictOf(difficulty)

    // 추천 태그: 사용되지 않은 상위 빈도 키워드
    const tags = ranked
      .filter(k => !usedWords.includes(k.word))
      .map(k => k.word)
      .slice(0, 10)

    return c.json({
      mainKeyword: kw,
      recommendedName: name,
      category,
      difficulty,
      verdict: v,
      totalProducts: shop.total,
      avgPrice: avgPrice(shop.items),
      keywords: ranked.map(k => ({ word: k.word, freq: k.freq, score: Math.round((k.score ?? 0) * 100) })),
      usedWords,
      tags,
      sampleTitles: shop.items.slice(0, 5).map(i => i.title),
    })
  } catch (e: any) {
    return c.json({ error: '네이버 쇼핑 API 호출 실패', detail: e?.message || String(e) }, 502)
  }
})

// 셀러랩스 상품명 추천기 — 데모 UI
app.get('/', (c) => c.html(DEMO_HTML))
app.notFound((c) => c.html(DEMO_HTML))

export default app
