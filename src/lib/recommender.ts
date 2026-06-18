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
  searchVolume?: number   // 메인 키워드 월간 검색량 (검색광고 API)
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
  maxWords = 9,
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
 * "최적화 이유"를 추천 상품명의 각 키워드별로 자동 생성한다.
 * 레퍼런스(storebooster) 패턴을 그대로 따른다:
 *  - 필수 키워드 배치 / 상위 키워드 우선순위 / 동일단어 반복 회피
 *  - 신뢰도·신선도·기능 표현 / 단어 수 최적화 / 검색 의도 매칭
 *
 * @param main      메인(필수) 키워드
 * @param usedWords 추천 상품명에 실제 사용된 단어 배열 (순서대로)
 * @param ranked    점수순 정렬된 키워드 통계 (volume/freq 보유)
 * @param hasVolume 검색광고 검색량 데이터 사용 여부
 */
export function buildReasons(
  main: string,
  usedWords: string[],
  ranked: KeywordStat[],
  hasVolume: boolean,
): string[] {
  const reasons: string[] = []
  const stat = (w: string) => ranked.find(k => k.word === w)
  const fmt = (n?: number) => (n ? n.toLocaleString() + '회' : '')

  // 신뢰도/신선도/기능을 나타내는 키워드 사전
  const TRUST = /무농약|유기농|친환경|국산|국내산|당일|산지직송|직송|HACCP|정품|무방부제|무첨가|프리미엄/
  const FRESH = /\d{2}년|신상|당일|수확|햇|신선|냉장|냉동|생물|활/
  const FORM = /세척|손질|진공|소포장|대용량|선물|박스|세트|kg|g\b/
  const FUNC = /자외선차단|기능성|무선|충전|온열|방수|접이식|휴대용|대형|미니|자동/

  // 1) 필수 키워드 배치
  const mainIdx = usedWords.findIndex(w => w === main || main.includes(w) || w.includes(main))
  if (mainIdx >= 0) {
    reasons.push(
      `필수 키워드 배치 — '${main}'을(를) 상품명 ${mainIdx === 0 ? '맨 앞' : (mainIdx + 1) + '번째'}에 배치해 검색 알고리즘의 핵심 매칭 요소를 확보했어요.`,
    )
  }

  // 2) 상위 검색량/빈도 키워드 우선순위
  const topKw = ranked.find(k => usedWords.includes(k.word) && (k.word !== main))
  if (topKw) {
    const idx = usedWords.indexOf(topKw.word) + 1
    const metric = hasVolume && topKw.volume
      ? `검색량 ${fmt(topKw.volume)}의 상위 키워드`
      : `상위 ${topKw.freq}개 상품에 등장한 핵심 키워드`
    reasons.push(
      `상위 키워드 우선순위 — '${topKw.word}'(${metric})을(를) ${idx}번째에 배치해 높은 검색 수요를 선점했어요.`,
    )
  }

  // 3) 신뢰도/신선도/기능/형태 표현 (사용된 단어 기준으로 동적으로)
  const trustW = usedWords.find(w => TRUST.test(w))
  if (trustW) reasons.push(`신뢰도 강화 — '${trustW}'(으)로 안전성·품질을 어필해 프리미엄 포지셔닝을 했어요.`)

  const freshW = usedWords.find(w => FRESH.test(w))
  if (freshW) reasons.push(`신선도 표현 — '${freshW}'(으)로 최신·신선 상품임을 명시해 구매 결정을 유도했어요.`)

  const formW = usedWords.find(w => FORM.test(w) && w !== freshW && w !== trustW)
  if (formW) reasons.push(`상품 형태/편의 표현 — '${formW}'(으)로 상품 구성·편의성을 강조했어요.`)

  const funcW = usedWords.find(w => FUNC.test(w) && w !== formW)
  if (funcW) reasons.push(`기능 강조 — '${funcW}' 기능을 명시해 관련 검색 수요에 대응했어요.`)

  // 4) 동일 단어 반복 회피 (필수 키워드가 2회 이상 등장하는 경우)
  const mainCount = usedWords.filter(w => w === main).length
  if (mainCount >= 2) {
    reasons.push(`품종/유형 다양성 표현 — 핵심어를 위치를 분리해 배치하여 상품의 다양한 종류를 폭넓게 커버했어요.`)
  }

  // 5) 단어 수 최적화
  reasons.push(
    `${usedWords.length}개 단어 정확 구성 — 네이버 스마트스토어 최적 길이(7~9단어)에 맞춰 노출을 극대화했어요.`,
  )

  // 6) 검색 의도 매칭
  const intentWords = usedWords.filter(w => w !== main).slice(0, 3)
  if (intentWords.length) {
    reasons.push(
      `검색 의도 매칭 — ${intentWords.map(w => `'${w}'`).join(', ')} 등 소비자 주요 검색어를 모두 포함해 검색 범위를 넓혔어요.`,
    )
  }

  // 7) 특수문자/길이 규칙
  reasons.push(`SEO 규칙 준수 — 특수문자 없이 50자 이내로 구성해 검색 패널티를 회피했어요.`)

  return reasons
}

/**
 * 진입 난이도 (0~100).
 * 검색량(수요)이 있으면 "상품 수 ÷ 검색량" 경쟁률을 반영하고,
 * 없으면 전체 상품 수(공급 경쟁)만으로 추정한다.
 *
 * 핵심 직관:
 *  - 상품 수가 많을수록(공급 과잉) 경쟁 ↑
 *  - 검색량 대비 상품 수가 많을수록(레드오션) 경쟁 ↑
 */
export function calcDifficulty(c: Competition): number {
  // 1) 공급 경쟁: 상품 수 로그 스케일 (100만개 = 1.0)
  const supply = Math.min(Math.log10(Math.max(c.totalProducts, 1)) / 6, 1)

  if (c.searchVolume && c.searchVolume > 0) {
    // 2) 경쟁률 = 상품 수 / 월간 검색량
    //    경쟁률이 높을수록(검색량 대비 상품 과잉) 레드오션
    const ratio = c.totalProducts / c.searchVolume
    // ratio 1 이하면 블루오션, 50 이상이면 극심한 레드오션 (로그 스케일)
    const competition = Math.min(Math.log10(Math.max(ratio, 1)) / 2, 1) // ratio 100 = 1.0
    // 공급 40% + 경쟁률 60% 가중
    const raw = (supply * 0.4 + competition * 0.6) * 100
    return Math.round(Math.min(Math.max(raw, 5), 95))
  }

  // 검색량이 없을 때: 공급 경쟁만으로
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
