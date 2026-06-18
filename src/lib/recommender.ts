/**
 * 상품명 추천 엔진 (서버사이드)
 * 빈도(60%) + 검색량(40%) 가중. 검색량이 없으면 빈도만으로 동작.
 */

export interface KeywordStat {
  word: string
  freq: number
  volume?: number
  score?: number
}

export interface Competition {
  totalProducts: number   // 네이버 쇼핑 전체 상품 수
  avgPrice: number
}

const normalize = (arr: number[]): number[] => {
  if (!arr.length) return []
  const lo = Math.min(...arr), hi = Math.max(...arr)
  return hi === lo ? arr.map(() => 1) : arr.map(v => (v - lo) / (hi - lo))
}

export function scoreKeywords(kws: KeywordStat[]): KeywordStat[] {
  const hasVolume = kws.some(k => typeof k.volume === 'number' && k.volume! > 0)
  const nf = normalize(kws.map(k => k.freq))
  const nv = hasVolume ? normalize(kws.map(k => k.volume || 0)) : nf.map(() => 0)
  return kws
    .map((k, i) => ({
      ...k,
      // 검색량 데이터가 없으면 빈도 100%로 동작
      score: hasVolume ? nf[i] * 0.6 + nv[i] * 0.4 : nf[i],
    }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
}

export function buildProductName(
  main: string,
  kws: KeywordStat[],
  extras: { brand?: string; volume?: string } = {},
  maxWords = 7,
  maxLen = 50,
): string {
  const ranked = scoreKeywords(kws)
  const out: string[] = []
  const used = new Set<string>()

  if (extras.brand) { out.push(extras.brand); used.add(extras.brand) }
  main.split(' ').forEach(t => { if (t && !used.has(t)) { out.push(t); used.add(t) } })

  for (const k of ranked) {
    if (out.length >= maxWords) break
    if (used.has(k.word)) continue
    if ([...used].some(u => u.includes(k.word) || k.word.includes(u))) continue
    if ([...out, k.word].join(' ').length > maxLen) continue
    out.push(k.word); used.add(k.word)
  }
  if (extras.volume && [...out, extras.volume].join(' ').length <= maxLen) {
    out.push(extras.volume)
  }
  return out.join(' ')
}

/**
 * 진입 난이도 (0~100). 검색량 API가 없으므로
 * 전체 상품 수(공급 경쟁)와 평균가격대를 보조 지표로 사용.
 */
export function calcDifficulty(c: Competition): number {
  // 상품 수가 많을수록 경쟁 심함 (로그 스케일)
  const supply = Math.min(Math.log10(Math.max(c.totalProducts, 1)) / 6, 1) // 100만개=1.0
  const raw = supply * 100
  return Math.round(Math.min(Math.max(raw, 5), 95))
}

export function verdictOf(score: number) {
  if (score < 35) return {
    label: '지금 들어가세요! 🟢', color: 'var(--green)',
    desc: '상위노출 경쟁이 낮은 키워드예요. 상품명 최적화만 잘해도 광고 없이 순위가 올라갑니다.',
  }
  if (score < 65) return {
    label: '해볼 만해요 🟡', color: 'var(--yellow)',
    desc: '경쟁이 보통 수준이에요. 상품명 + 리뷰 관리를 병행하면 충분히 상위권 진입이 가능합니다.',
  }
  return {
    label: '경쟁이 셉니다 🔴', color: 'var(--red)',
    desc: '이미 강한 셀러들이 자리잡은 키워드예요. 상품명을 더 구체적인 세부 키워드로 좁혀보세요.',
  }
}
