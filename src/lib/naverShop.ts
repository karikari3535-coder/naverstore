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
  // 식품/농산물
  {
    group: '품종/종류',
    patterns: [/베니하루카/, /호박고구마/, /밤고구마/, /꿀고구마/, /샤인머스캣/, /설향/, /대저/, /스테비아/, /방울/, /대추방울/, /흑/, /적/, /청/, /백/],
  },
  {
    group: '수확/신선도',
    patterns: [/^\d{2}년산?$/, /^햇[가-힣]+/, /당일수확/, /^수확/, /산지직송/, /직송/, /^생물$/, /냉장/, /냉동/, /숙성/],
  },
  {
    group: '중량/규격',
    patterns: [/\d+kg/i, /\d+g\b/, /\d+ml/i, /\d+L\b/i, /\d+개입?/, /\d+팩/, /\d+병/, /\d+박스/, /대용량/, /소포장/, /실속/],
  },
  // 건강/생활
  {
    group: '사용부위',
    patterns: [/허리/, /복부/, /어깨/, /목/, /무릎/, /발/, /손목/, /종아리/, /눈/, /얼굴/, /등/, /다리/, /전신/, /국소/],
  },
  {
    group: '형태',
    patterns: [/매트/, /팩/, /벨트/, /패드/, /기기/, /마사지기/, /쿠션/, /방석/, /담요/, /찜질기/, /온열기/, /램프/, /밴드/, /스틱/, /롤러/, /사각형/, /원형/, /의자방석/, /메모리폼/],
  },
  // 패션/잡화
  {
    group: '소재',
    patterns: [/폴리에스테르/, /폴리에스터/, /면\b/, /순면/, /밀짚/, /라텍스/, /스펀지/, /가죽/, /데님/, /린넨/, /마\b/, /지사/, /나일론/, /스판/],
  },
  {
    group: '색상',
    patterns: [/화이트/, /블랙/, /그레이/, /네이비/, /베이지/, /아이보리/, /브라운/, /그린/, /핑크/, /레드/, /블루/, /카키/],
  },
  {
    group: '사용계절',
    patterns: [/봄\b/, /여름/, /가을/, /겨울/, /사계절/, /간절기/],
  },
  // 가전
  {
    group: '용량/등급',
    patterns: [/\d+등급/, /\d+kg/i, /인버터/, /BLDC/i, /절전/, /저소음/, /\d+인용/, /\d+L\b/i],
  },
  {
    group: '특징/기능',
    patterns: [/원적외선/, /근적외선/, /게르마늄/, /무선/, /충전/, /usb/i, /전기/, /온도조절/, /타이머/, /휴대용/, /미니/, /대형/, /접이식/, /방수/, /의료기기?/, /천연/, /국산/, /무농약/, /유기농/, /친환경/, /led/i, /자동/, /고급/, /자외선차단/, /기능성/, /미끄럼방지/, /통풍/, /세척/, /손질/],
  },
  {
    group: '대상',
    patterns: [/생리통/, /여성/, /남성/, /남녀공용/, /산모/, /임산부/, /어르신/, /노인/, /아기/, /유아/, /반려/, /강아지/, /고양이/, /사무실/, /가정용/, /업소용/],
  },
]

export function extractKeyInfo(
  items: ShopItem[],
): { group: string; items: { word: string; count: number }[] }[] {
  // 단어별 등장 상품 수 카운트 (상품당 1회). 괄호/특수문자는 정리.
  const wordCount = new Map<string, number>()
  for (const it of items) {
    const seen = new Set<string>()
    for (const raw of it.title.split(/\s+/)) {
      const w = raw.trim().replace(/^[\[\(]+|[\]\)]+$/g, '') // 양끝 괄호 제거
      if (w.length < 2) continue
      const lower = w.toLowerCase()
      if (seen.has(lower)) continue
      seen.add(lower)
      wordCount.set(w, (wordCount.get(w) || 0) + 1)
    }
  }

  const result: { group: string; items: { word: string; count: number }[] }[] = []
  const usedWords = new Set<string>() // 그룹 간 중복 단어 방지 (먼저 매칭된 그룹이 우선)
  for (const { group, patterns } of ATTRIBUTE_DICT) {
    const matched = new Map<string, number>()
    for (const [word, count] of wordCount) {
      if (count < 2) continue // 2개 이상 상품에 등장
      const lower = word.toLowerCase()
      if (usedWords.has(lower)) continue
      if (patterns.some(p => p.test(word))) {
        matched.set(word, count)
      }
    }
    const list = [...matched.entries()]
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
    if (list.length >= 2) { // 항목 1개뿐인 그룹은 의미가 약하므로 생략
      list.forEach(i => usedWords.add(i.word.toLowerCase()))
      result.push({ group, items: list })
    }
  }
  return result
}
