/**
 * 네이버 쇼핑 검색 API 연동 (developers.naver.com)
 * 서버사이드에서만 호출 — Client ID/Secret은 Cloudflare Secret으로 주입된다.
 * 절대 프론트엔드로 노출하지 않는다.
 */

export interface ShopItem {
  title: string        // HTML 태그 제거된 상품명
  category1: string
  category2: string
  category3: string
  category4: string
  lprice: number
  mallName: string
  brand: string
  maker: string
}

export interface ShopResult {
  total: number        // 전체 상품 수 (경쟁 강도 추정용)
  items: ShopItem[]
}

const SHOP_ENDPOINT = 'https://openapi.naver.com/v1/search/shop.json'

/** <b> 등 HTML 태그와 엔티티 제거 */
function stripHtml(s: string): string {
  return String(s || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

/**
 * 네이버 쇼핑 상위 상품을 가져온다 (기본 40개).
 * @param query 검색 키워드
 * @param env   { NAVER_SHOP_ID, NAVER_SHOP_SECRET }
 */
export async function searchShop(
  query: string,
  env: { NAVER_SHOP_ID?: string; NAVER_SHOP_SECRET?: string },
  display = 40,
): Promise<ShopResult> {
  const id = env.NAVER_SHOP_ID
  const secret = env.NAVER_SHOP_SECRET
  if (!id || !secret) {
    throw new Error('NAVER_SHOP_ID / NAVER_SHOP_SECRET 환경변수가 설정되지 않았습니다.')
  }

  const url = `${SHOP_ENDPOINT}?query=${encodeURIComponent(query)}&display=${display}&start=1&sort=sim`
  const res = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': id,
      'X-Naver-Client-Secret': secret,
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`네이버 쇼핑 API ${res.status}: ${body.slice(0, 200)}`)
  }

  const data: any = await res.json()
  const items: ShopItem[] = (data.items || []).map((it: any) => ({
    title: stripHtml(it.title),
    category1: it.category1 || '',
    category2: it.category2 || '',
    category3: it.category3 || '',
    category4: it.category4 || '',
    lprice: Number(it.lprice) || 0,
    mallName: it.mallName || '',
    brand: it.brand || '',
    maker: it.maker || '',
  }))

  return { total: Number(data.total) || items.length, items }
}

/**
 * 상위 상품명들에서 키워드 빈도를 추출한다.
 * 메인 키워드의 토큰은 제외하고, 1글자 토큰/순수 숫자/특수문자는 거른다.
 */
export function extractKeywordFreq(
  items: ShopItem[],
  mainKeyword: string,
): { word: string; freq: number }[] {
  const mainTokens = new Set(
    mainKeyword.replace(/\s+/g, '').toLowerCase().match(/[가-힣a-z0-9]+/g) || [],
  )
  const mainNoSpace = mainKeyword.replace(/\s+/g, '').toLowerCase()

  const counter = new Map<string, number>()
  for (const it of items) {
    const tokens = it.title.split(/\s+/)
    const seen = new Set<string>() // 한 상품명 내 중복 토큰은 1회만
    for (const raw of tokens) {
      const w = raw.trim()
      if (!w) continue
      const lower = w.toLowerCase()
      // 필터: 1글자, 순수 숫자, 메인키워드와 동일/포함
      if (w.length < 2) continue
      if (/^[0-9]+$/.test(w)) continue
      if (mainTokens.has(lower)) continue
      if (mainNoSpace.includes(lower) || lower.includes(mainNoSpace)) continue
      // 용량/수량성 토큰(500g, 1kg 등)도 노이즈로 제외
      if (/^\d+[a-zA-Z가-힣]{1,3}$/.test(w)) continue
      if (seen.has(lower)) continue
      seen.add(lower)
      counter.set(w, (counter.get(w) || 0) + 1)
    }
  }

  let list = [...counter.entries()]
    .map(([word, freq]) => ({ word, freq }))
    .filter(k => k.freq >= 2) // 2회 이상 등장한 키워드만
    .sort((a, b) => b.freq - a.freq)

  // 포함 관계 중복 정리: "흰다리새우"가 있으면 "흰다리" 제거 (더 구체적인 쪽 유지)
  list = list.filter((k, i) =>
    !list.some((other, j) =>
      j !== i &&
      other.word.length > k.word.length &&
      other.word.includes(k.word) &&
      other.freq >= k.freq * 0.6, // 빈도가 비슷할 때만 흡수
    ),
  )

  return list.slice(0, 12)
}

/** 상위 상품들에서 가장 빈번한 카테고리 경로를 추출 */
export function extractCategory(items: ShopItem[]): string {
  const counter = new Map<string, number>()
  for (const it of items) {
    const path = [it.category1, it.category2, it.category3, it.category4]
      .filter(Boolean)
      .join(' > ')
    if (path) counter.set(path, (counter.get(path) || 0) + 1)
  }
  let best = ''
  let max = 0
  for (const [path, n] of counter) {
    if (n > max) { max = n; best = path }
  }
  return best
}

/** 평균 가격 (경쟁 분석 보조 지표) */
export function avgPrice(items: ShopItem[]): number {
  const prices = items.map(i => i.lprice).filter(p => p > 0)
  if (!prices.length) return 0
  return Math.round(prices.reduce((s, p) => s + p, 0) / prices.length)
}

/**
 * 상위 상품명들의 "단어 개수" 분포를 산출한다.
 * 레퍼런스 사이트의 "상품명 길이 분포"에 대응.
 * 반환: [{ words: 10, count: 7 }, ...] (단어 수 오름차순)
 */
export function nameLengthDistribution(items: ShopItem[]): {
  distribution: { words: number; count: number }[]
  avgWords: number
  avgChars: number
  recommendedRange: [number, number]
} {
  const wordCounts: number[] = []
  const charCounts: number[] = []
  for (const it of items) {
    const tokens = it.title.split(/\s+/).filter(Boolean)
    if (!tokens.length) continue
    wordCounts.push(tokens.length)
    charCounts.push(it.title.replace(/\s+/g, '').length)
  }
  const counter = new Map<number, number>()
  for (const w of wordCounts) counter.set(w, (counter.get(w) || 0) + 1)
  const distribution = [...counter.entries()]
    .map(([words, count]) => ({ words, count }))
    .sort((a, b) => a.words - b.words)

  const avg = (arr: number[]) =>
    arr.length ? Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10 : 0
  const avgWords = avg(wordCounts)

  // 가장 빈번한 상위 구간을 권장 범위로
  const sortedByCount = [...distribution].sort((a, b) => b.count - a.count)
  const topWords = sortedByCount.slice(0, 3).map(d => d.words).sort((a, b) => a - b)
  const recommendedRange: [number, number] =
    topWords.length ? [topWords[0], topWords[topWords.length - 1]] : [0, 0]

  return { distribution, avgWords, avgChars: avg(charCounts), recommendedRange }
}

/**
 * 상품 주요정보 분류 — 상위 상품명에 자주 등장하는 키워드를
 * 사전 기반으로 "형태 / 특징 / 사용부위 / 용량·수량" 그룹으로 묶는다.
 * (네이버 쇼핑이 노출하는 '주요정보' 영역에 대응하는 휴리스틱)
 */
const ATTRIBUTE_DICT: { group: string; patterns: RegExp[] }[] = [
  {
    group: '사용부위',
    patterns: [/허리/, /복부/, /어깨/, /목/, /무릎/, /발/, /손목/, /종아리/, /눈/, /얼굴/, /등/, /배/, /다리/, /손/, /전신/, /국소/],
  },
  {
    group: '형태',
    patterns: [/매트/, /팩/, /벨트/, /패드/, /기기/, /마사지기/, /쿠션/, /방석/, /담요/, /찜질기/, /온열기/, /램프/, /밴드/, /스틱/, /롤러/],
  },
  {
    group: '특징/기능',
    patterns: [/원적외선/, /근적외선/, /게르마늄/, /무선/, /충전/, /usb/i, /전기/, /온도조절/, /타이머/, /휴대용/, /미니/, /대형/, /접이식/, /방수/, /의료기기?/, /천연/, /국산/, /led/i, /자동/, /고급/],
  },
  {
    group: '대상',
    patterns: [/생리통/, /여성/, /남성/, /산모/, /임산부/, /어르신/, /노인/, /아기/, /유아/, /반려/, /강아지/, /고양이/, /사무실/, /가정용/, /업소용/],
  },
]

export function extractKeyInfo(
  items: ShopItem[],
): { group: string; items: { word: string; count: number }[] }[] {
  // 단어별 등장 상품 수 카운트 (상품당 1회)
  const wordCount = new Map<string, number>()
  for (const it of items) {
    const seen = new Set<string>()
    for (const raw of it.title.split(/\s+/)) {
      const w = raw.trim()
      if (w.length < 2) continue
      const lower = w.toLowerCase()
      if (seen.has(lower)) continue
      seen.add(lower)
      wordCount.set(w, (wordCount.get(w) || 0) + 1)
    }
  }

  const result: { group: string; items: { word: string; count: number }[] }[] = []
  for (const { group, patterns } of ATTRIBUTE_DICT) {
    const matched = new Map<string, number>()
    for (const [word, count] of wordCount) {
      if (count < 2) continue // 2개 이상 상품에 등장
      if (patterns.some(p => p.test(word))) {
        matched.set(word, count)
      }
    }
    const list = [...matched.entries()]
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
    if (list.length) result.push({ group, items: list })
  }
  return result
}
