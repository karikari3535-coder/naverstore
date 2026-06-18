import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { DEMO_HTML } from './demoHtml'
import {
  searchShop,
  extractKeywordFreq,
  extractCategory,
  avgPrice,
  nameLengthDistribution,
  extractKeyInfo,
} from './lib/naverShop'
import { scoreKeywords, buildProductName, calcDifficulty, verdictOf } from './lib/recommender'
import { getKeywordVolumes, buildVolumeMap, lookupVolume, hasAdKeys } from './lib/naverSearchAd'

type Bindings = {
  NAVER_SHOP_ID?: string
  NAVER_SHOP_SECRET?: string
  NAVER_AD_API_KEY?: string
  NAVER_AD_SECRET_KEY?: string
  NAVER_AD_CUSTOMER_ID?: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

// 헬스체크
app.get('/healthz', (c) => c.text('ok'))

// API 키 설정 여부 (프론트가 실데이터 모드인지 판단용 — 키 값은 노출 안 함)
app.get('/api/status', (c) => {
  const ok = !!(c.env.NAVER_SHOP_ID && c.env.NAVER_SHOP_SECRET)
  return c.json({ liveData: ok, searchVolume: hasAdKeys(c.env) })
})

/**
 * GET /api/analyze?kw=신안새우&brand=...&volume=...
 * 네이버 쇼핑 상위 40개 + 검색광고 검색량을 분석해
 * 추천 상품명/카테고리/키워드(검색량)/난이도/길이분포/주요정보를 반환.
 */
app.get('/api/analyze', async (c) => {
  const kw = (c.req.query('kw') || '').trim()
  const brand = (c.req.query('brand') || '').trim()
  const volume = (c.req.query('volume') || '').trim()
  if (!kw) return c.json({ error: '키워드(kw)가 필요해요.' }, 400)

  try {
    // 쇼핑 + 검색량 병렬 호출 (검색량 실패해도 분석은 계속)
    const [shop, adVolumes] = await Promise.all([
      searchShop(kw, c.env, 40),
      getKeywordVolumes(kw, c.env).catch(() => []),
    ])

    const freqKws = extractKeywordFreq(shop.items, kw)

    if (!freqKws.length) {
      return c.json({
        error: '상위 상품에서 추출할 키워드가 부족해요. 더 일반적인 키워드로 시도해보세요.',
        total: shop.total,
      }, 422)
    }

    // 검색량 맵 구성 + 키워드에 검색량 병합
    const volMap = buildVolumeMap(adVolumes)
    const hasVolume = volMap.size > 0
    const withVolume = freqKws.map(k => ({
      word: k.word,
      freq: k.freq,
      volume: lookupVolume(volMap, k.word)?.volume,
    }))

    const ranked = scoreKeywords(withVolume)
    const name = buildProductName(kw, ranked, { brand, volume })
    const usedWords = name.split(' ')
    const category = extractCategory(shop.items)

    // 메인 키워드 자체의 검색량
    const mainVol = lookupVolume(volMap, kw)
    const mainSearchVolume = mainVol?.volume

    const difficulty = calcDifficulty({
      totalProducts: shop.total,
      avgPrice: avgPrice(shop.items),
      searchVolume: mainSearchVolume,
    })
    const v = verdictOf(difficulty)

    // 추천 태그: 사용되지 않은 상위 키워드
    const tags = ranked
      .filter(k => !usedWords.includes(k.word))
      .map(k => k.word)
      .slice(0, 10)

    // 길이 분포 & 주요정보
    const lengthDist = nameLengthDistribution(shop.items)
    const keyInfo = extractKeyInfo(shop.items)

    return c.json({
      mainKeyword: kw,
      recommendedName: name,
      category,
      difficulty,
      verdict: v,
      totalProducts: shop.total,
      avgPrice: avgPrice(shop.items),
      hasSearchVolume: hasVolume,
      mainSearchVolume,                              // 메인 키워드 월간 검색량
      mainSearchVolumePc: mainVol?.pc,
      mainSearchVolumeMobile: mainVol?.mobile,
      mainCompIdx: mainVol?.compIdx,
      keywords: ranked.map(k => ({
        word: k.word,
        freq: k.freq,
        volume: k.volume ?? null,
        score: Math.round((k.score ?? 0) * 100),
      })),
      usedWords,
      tags,
      lengthDistribution: lengthDist.distribution,
      avgWords: lengthDist.avgWords,
      avgChars: lengthDist.avgChars,
      recommendedRange: lengthDist.recommendedRange,
      keyInfo,
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
