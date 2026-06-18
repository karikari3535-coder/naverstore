/**
 * 네이버 검색광고 API 연동 (searchad.naver.com)
 * 키워드별 월간 검색량(monthlyPcQcCnt + monthlyMobileQcCnt)을 가져온다.
 *
 * Cloudflare Workers 런타임은 Node 'crypto' 모듈이 없으므로
 * Web Crypto API(HMAC-SHA256)로 서명한다.
 *
 * 인증 헤더:
 *   X-Timestamp  : 밀리초 타임스탬프
 *   X-API-KEY    : 액세스 라이선스 (NAVER_AD_API_KEY)
 *   X-Customer   : CUSTOMER_ID 숫자 (NAVER_AD_CUSTOMER_ID)
 *   X-Signature  : base64( HMAC-SHA256( secret, `${ts}.${method}.${path}` ) )
 */

export interface AdEnv {
  NAVER_AD_API_KEY?: string
  NAVER_AD_SECRET_KEY?: string
  NAVER_AD_CUSTOMER_ID?: string
}

export interface KeywordVolume {
  word: string
  volume: number      // PC + 모바일 월간 검색량
  pc: number
  mobile: number
  compIdx: string     // 경쟁정도: 낮음/중간/높음
}

const BASE = 'https://api.searchad.naver.com'

/** "< 10" 같은 표기를 숫자로 변환 */
function toNum(v: string | number | undefined): number {
  if (v == null) return 0
  return Number(String(v).replace(/[^0-9]/g, '')) || 0
}

/** Web Crypto 로 HMAC-SHA256 서명 (base64) */
async function sign(secret: string, ts: string, method: string, path: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const msg = `${ts}.${method}.${path}`
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(msg))
  // ArrayBuffer -> base64
  const bytes = new Uint8Array(sigBuf)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

/** 검색광고 키가 모두 설정되어 있는지 */
export function hasAdKeys(env: AdEnv): boolean {
  return !!(env.NAVER_AD_API_KEY && env.NAVER_AD_SECRET_KEY && env.NAVER_AD_CUSTOMER_ID)
}

/**
 * 키워드 도구(keywordstool)로 연관 키워드 + 월간 검색량을 가져온다.
 * 실패 시 빈 배열 반환 (호출부에서 빈도 기반으로 폴백).
 */
export async function getKeywordVolumes(
  keyword: string,
  env: AdEnv,
): Promise<KeywordVolume[]> {
  if (!hasAdKeys(env)) return []

  const path = '/keywordstool'
  const ts = Date.now().toString()
  const signature = await sign(env.NAVER_AD_SECRET_KEY!, ts, 'GET', path)

  const qs = new URLSearchParams({
    hintKeywords: keyword.replace(/\s+/g, ''),
    showDetail: '1',
  })

  const res = await fetch(`${BASE}${path}?${qs}`, {
    headers: {
      'X-Timestamp': ts,
      'X-API-KEY': env.NAVER_AD_API_KEY!,
      'X-Customer': env.NAVER_AD_CUSTOMER_ID!,
      'X-Signature': signature,
    },
  })

  if (!res.ok) {
    // 권한/한도 문제여도 전체 분석은 계속되도록 빈 배열 반환
    return []
  }

  const data: any = await res.json().catch(() => ({}))
  const list = Array.isArray(data.keywordList) ? data.keywordList : []
  return list.map((k: any) => {
    const pc = toNum(k.monthlyPcQcCnt)
    const mobile = toNum(k.monthlyMobileQcCnt)
    return {
      word: String(k.relKeyword || '').replace(/\s+/g, ''),
      volume: pc + mobile,
      pc,
      mobile,
      compIdx: String(k.compIdx || ''),
    } as KeywordVolume
  })
}

/**
 * 특정 키워드들의 검색량을 "직접" 조회한다.
 * keywordstool 의 hintKeywords 는 콤마로 최대 5개까지 받으며,
 * 입력한 키워드 자체의 검색량을 결과에 포함시켜 준다.
 *
 * 연관키워드 목록(getKeywordVolumes)에는 "전기/복부/어깨" 같은
 * 일반 단어가 빠지는 경우가 많아, 추천에 쓰인 키워드는 이 함수로
 * 정확한 검색량을 보강한다.
 *
 * 실패한 배치는 건너뛰고, 가능한 만큼만 반환한다.
 */
export async function getVolumesForKeywords(
  words: string[],
  env: AdEnv,
): Promise<KeywordVolume[]> {
  if (!hasAdKeys(env) || !words.length) return []

  // 공백 제거 + 중복 제거
  const uniq = [...new Set(words.map(w => w.replace(/\s+/g, '')).filter(Boolean))]

  // 5개씩 배치
  const batches: string[][] = []
  for (let i = 0; i < uniq.length; i += 5) batches.push(uniq.slice(i, i + 5))

  const path = '/keywordstool'
  const results: KeywordVolume[] = []

  // 배치 병렬 호출 (실패 배치는 무시)
  const settled = await Promise.allSettled(
    batches.map(async (batch) => {
      const ts = Date.now().toString()
      const signature = await sign(env.NAVER_AD_SECRET_KEY!, ts, 'GET', path)
      const qs = new URLSearchParams({ hintKeywords: batch.join(','), showDetail: '1' })
      const res = await fetch(`${BASE}${path}?${qs}`, {
        headers: {
          'X-Timestamp': ts,
          'X-API-KEY': env.NAVER_AD_API_KEY!,
          'X-Customer': env.NAVER_AD_CUSTOMER_ID!,
          'X-Signature': signature,
        },
      })
      if (!res.ok) return [] as KeywordVolume[]
      const data: any = await res.json().catch(() => ({}))
      const list = Array.isArray(data.keywordList) ? data.keywordList : []
      // 배치에 넣은 키워드만 추려서 반환 (연관확장 노이즈 제거)
      const batchSet = new Set(batch.map(b => b.toLowerCase()))
      return list
        .filter((k: any) => batchSet.has(String(k.relKeyword || '').replace(/\s+/g, '').toLowerCase()))
        .map((k: any) => {
          const pc = toNum(k.monthlyPcQcCnt)
          const mobile = toNum(k.monthlyMobileQcCnt)
          return {
            word: String(k.relKeyword || '').replace(/\s+/g, ''),
            volume: pc + mobile,
            pc,
            mobile,
            compIdx: String(k.compIdx || ''),
          } as KeywordVolume
        })
    }),
  )

  for (const s of settled) {
    if (s.status === 'fulfilled') results.push(...s.value)
  }
  return results
}

/**
 * 검색량 리스트를 word -> volume 맵으로 변환 (빠른 조회용).
 * 키는 공백 제거 + 소문자 정규화.
 */
export function buildVolumeMap(...sources: KeywordVolume[][]): Map<string, KeywordVolume> {
  const m = new Map<string, KeywordVolume>()
  for (const vols of sources) {
    for (const v of vols) {
      const key = v.word.replace(/\s+/g, '').toLowerCase()
      // 더 큰 검색량(또는 기존 0이던 값)을 우선 유지
      if (!key) continue
      const prev = m.get(key)
      if (!prev || (v.volume > 0 && prev.volume === 0) || v.volume > prev.volume) {
        m.set(key, v)
      }
    }
  }
  return m
}

/** 특정 키워드의 월간 검색량 조회 (없으면 undefined) */
export function lookupVolume(map: Map<string, KeywordVolume>, word: string): KeywordVolume | undefined {
  return map.get(word.replace(/\s+/g, '').toLowerCase())
}
