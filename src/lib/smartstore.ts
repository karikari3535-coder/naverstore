/**
 * 스마트스토어 공개 상품 페이지 데이터 파서
 * (Cloudflare Workers 호환 — fetch + 정규식/JSON 추출만 사용)
 *
 * ⚠️ 한계
 *  스마트스토어의 진단 핵심값(상품속성/태그/배송설정/상품정보제공고시/리뷰포인트)은
 *  대부분 판매자 센터(관리자)에만 존재하고 공개 페이지에는 노출되지 않는다.
 *  따라서 이 파서는 "공개 페이지에서 확보 가능한 항목"만 자동 수집한다:
 *    - 상품명, 가격, 대표/추가 이미지 수, 리뷰 수, 평균 별점, 카테고리(있으면)
 *  나머지는 engine 단계에서 사용자 체크리스트로 보완한다.
 *
 * 동작 개요
 *  1) 입력 URL에서 productId(+channel/storeName) 추출. naver.me 단축링크면 redirect 추적.
 *  2) 모바일 상품 페이지 HTML을 fetch.
 *  3) HTML 안의 __PRELOADED_STATE__ 또는 application/ld+json(JSON-LD)에서
 *     상품 정보를 추출/파싱.
 */

const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'

export interface StoreData {
  /** 상품 ID */
  productId: string
  /** 스토어(채널) 이름 */
  storeName: string | null
  /** 상품명 */
  name: string
  /** 상품명 글자수(공백 포함) */
  nameLength: number
  /** 카테고리(공개 노출되는 경우) */
  category: string | null
  /** 판매가 */
  price: number | null
  /** 대표 이미지 URL */
  imageUrl: string | null
  /** 추가 이미지 수(대표 포함 총 이미지 수 근사) */
  imageCount: number | null
  /** 총 리뷰 수 */
  reviewCount: number | null
  /** 평균 별점 (0~5) */
  starRating: number | null
  /** 자동 수집 성공한 필드 키 목록 (리포트 신뢰도 표시용) */
  collected: string[]
  /** 수집 실패/부분 수집 여부 메모 */
  notes: string[]
  /** 네이버 봇 차단(429/490/418/403)으로 자동수집이 막혔는지 */
  blocked: boolean
}

/* ------------------------------------------------------------------ */
/* productId 추출                                                       */
/* ------------------------------------------------------------------ */

function extractProductInfo(
  url: string
): { productId: string; storeName: string | null } | null {
  // 지원 URL 예시
  //  - https://smartstore.naver.com/{store}/products/{productId}
  //  - https://brand.naver.com/{store}/products/{productId}
  //  - https://m.smartstore.naver.com/{store}/products/{productId}
  //  - https://shopping.naver.com/.../products/{productId}
  //  - https://msearch.shopping.naver.com/product/{productId}
  //  - naver.me 단축링크(사전 해제 후)

  // 1) /{store}/products/{id}
  const storeMatch = url.match(
    /(?:smartstore|brand|shopping)\.naver\.com\/([^/]+)\/products\/(\d{5,})/i
  )
  if (storeMatch) {
    const store = storeMatch[1]
    // 'm' 같은 모바일 서브경로는 스토어명이 아님
    return {
      productId: storeMatch[2],
      storeName: store === 'm' ? null : decodeURIComponent(store),
    }
  }

  // 2) /products/{id} (스토어명 없는 형태)
  const prodMatch = url.match(/\/products?\/(\d{5,})/i)
  if (prodMatch) return { productId: prodMatch[1], storeName: null }

  // 3) ?productId=12345 / nvMid=12345 / catalogId
  const queryMatch = url.match(/[?&](?:productId|nvMid|catalogId|id)=(\d{5,})/i)
  if (queryMatch) return { productId: queryMatch[1], storeName: null }

  // 4) 폴백: URL 안의 가장 긴 숫자열(5자리 이상)
  const numMatches = url.match(/\d{5,}/g)
  if (numMatches && numMatches.length) {
    const id = numMatches.sort((a, b) => b.length - a.length)[0]
    return { productId: id, storeName: null }
  }

  return null
}

async function resolveShortUrl(url: string): Promise<string> {
  const res = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    headers: { 'User-Agent': MOBILE_UA },
  })
  return res.url || url
}

/* ------------------------------------------------------------------ */
/* __PRELOADED_STATE__ 추출 (brace-balance)                            */
/* ------------------------------------------------------------------ */

function extractPreloadedState(html: string): Record<string, any> | null {
  const markers = ['window.__PRELOADED_STATE__', '__PRELOADED_STATE__']
  for (const marker of markers) {
    const idx = html.indexOf(marker)
    if (idx === -1) continue
    const eq = html.indexOf('=', idx)
    if (eq === -1) continue
    const start = html.indexOf('{', eq)
    if (start === -1) continue

    let depth = 0
    let inStr = false
    let strCh = ''
    let esc = false
    let end = -1
    for (let i = start; i < html.length; i++) {
      const ch = html[i]
      if (inStr) {
        if (esc) esc = false
        else if (ch === '\\') esc = true
        else if (ch === strCh) inStr = false
        continue
      }
      if (ch === '"' || ch === "'") {
        inStr = true
        strCh = ch
        continue
      }
      if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) {
          end = i + 1
          break
        }
      }
    }
    if (end === -1) continue
    try {
      return JSON.parse(html.slice(start, end))
    } catch {
      continue
    }
  }
  return null
}

/* ------------------------------------------------------------------ */
/* JSON-LD 추출 (fallback)                                              */
/* ------------------------------------------------------------------ */

function extractJsonLd(html: string): any[] {
  const results: any[] = []
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    try {
      results.push(JSON.parse(m[1].trim()))
    } catch {
      /* ignore */
    }
  }
  return results
}

/* ------------------------------------------------------------------ */
/* PRELOADED_STATE에서 상품 객체 탐색                                   */
/* ------------------------------------------------------------------ */

function findProductNode(state: Record<string, any>): any {
  // 스마트스토어 구조: state.product.A 또는 state.product 직접
  const p = state.product
  if (p && typeof p === 'object') {
    // product.A.{...} 형태가 흔함
    if (p.A && typeof p.A === 'object') return p.A
    return p
  }
  // 깊이 탐색: name + productId 류 필드를 가진 객체 찾기
  let found: any = null
  const visit = (node: any, depth: number) => {
    if (found || !node || typeof node !== 'object' || depth > 6) return
    if (
      (node.name || node.productName) &&
      (node.id || node.productId || node.channelProductNo)
    ) {
      found = node
      return
    }
    for (const k of Object.keys(node)) visit(node[k], depth + 1)
  }
  visit(state, 0)
  return found
}

/* ------------------------------------------------------------------ */
/* 메인                                                                 */
/* ------------------------------------------------------------------ */

export async function fetchStoreData(inputUrl: string): Promise<StoreData> {
  let url = inputUrl.trim()

  // 공유 텍스트에 섞인 URL 추출
  const urlMatch = url.match(/https?:\/\/[^\s]+/)
  if (urlMatch) url = urlMatch[0]

  // naver.me 단축링크 해제
  if (/naver\.me/.test(url)) {
    url = await resolveShortUrl(url)
  }

  let info = extractProductInfo(url)
  if (!info) {
    url = await resolveShortUrl(url)
    info = extractProductInfo(url)
  }
  if (!info) {
    throw new Error('상품 URL에서 상품 ID를 찾지 못했어요. 스마트스토어 상품 링크를 확인해주세요.')
  }

  const { productId, storeName } = info

  const notes: string[] = []
  const collected: string[] = []

  // 브라우저에 가깝게 보이도록 헤더를 구성한다.
  // (스마트스토어는 데이터센터/봇 트래픽을 429/490/418로 강하게 차단하므로,
  //  여러 UA·Referer 조합으로 시도하되 실패 시 우아하게 폴백한다.)
  const headerSets = [
    {
      'User-Agent': MOBILE_UA,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      Referer: 'https://m.search.naver.com/',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'cross-site',
      'Upgrade-Insecure-Requests': '1',
    },
    {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9',
      Referer: 'https://search.shopping.naver.com/',
    },
  ]

  let html: string | null = null
  let blocked = false
  // 가능한 경로 후보 (스토어명이 있으면 정확 경로 우선)
  const candidates: string[] = []
  if (storeName) {
    candidates.push(`https://m.smartstore.naver.com/${storeName}/products/${productId}`)
    candidates.push(`https://smartstore.naver.com/${storeName}/products/${productId}`)
  }
  // 폴백: 원본 URL 그대로
  candidates.push(url)

  outer: for (const target of candidates) {
    for (const hs of headerSets) {
      try {
        const res = await fetch(target, { headers: hs, redirect: 'follow' })
        // 차단 코드 감지 (429: Too Many Requests, 490/418: 네이버 봇 차단)
        if (res.status === 429 || res.status === 490 || res.status === 418 || res.status === 403) {
          blocked = true
          continue
        }
        const text = await res.text()
        // (1) 에러/차단 안내 페이지 감지 (status 200이어도 본문이 에러일 수 있음)
        const head = text.slice(0, 3000)
        if (/에러페이지|error-page|일시적으로|접근이 제한|too many requests/i.test(head)) {
          blocked = true
          continue
        }
        // (2) 네이버 로그인/캡차 셸 감지 (봇 차단의 또 다른 형태)
        //     og:title="네이버" + 로그인 유도 문구 → 상품 페이지 아님
        const ogTitleNaver = /property=["']og:title["']\s+content=["']네이버["']/.test(text)
        const loginShell =
          ogTitleNaver || /나를 위한 다양한 서비스|로그인 하고|captcha|자동입력 방지/i.test(head)
        if (loginShell && !text.includes('__PRELOADED_STATE__')) {
          blocked = true
          continue
        }
        // (3) 유효한 상품 페이지 신호 확인
        if (res.ok && text && text.length > 5000) {
          if (text.includes('__PRELOADED_STATE__') || /application\/ld\+json/.test(text)) {
            html = text
            break outer
          }
        }
      } catch {
        /* try next */
      }
    }
  }

  // 기본값
  const data: StoreData = {
    productId,
    storeName,
    name: '',
    nameLength: 0,
    category: null,
    price: null,
    imageUrl: null,
    imageCount: null,
    reviewCount: null,
    starRating: null,
    collected,
    notes,
    blocked,
  }

  if (!html) {
    if (blocked) {
      notes.push(
        '네이버가 외부 자동 수집을 차단했어요(정상 동작). 아래 자동 채점 항목은 직접 입력하고, 나머지는 체크리스트로 진단해요.'
      )
    } else {
      notes.push('공개 페이지를 가져오지 못했어요. 자동 수집 없이 체크리스트로 진단해요.')
    }
    return data
  }

  // 1) PRELOADED_STATE 시도
  const state = extractPreloadedState(html)
  const node = state ? findProductNode(state) : null

  if (node) {
    if (node.name || node.productName) {
      data.name = String(node.name || node.productName)
      data.nameLength = data.name.length
      collected.push('name')
    }
    if (typeof node.salePrice === 'number') {
      data.price = node.salePrice
      collected.push('price')
    } else if (typeof node.price === 'number') {
      data.price = node.price
      collected.push('price')
    }
    // 이미지 수: optionalImages / productImages 등
    const imgs =
      node.productImages || node.images || node.optionalImages || node.representImage
    if (Array.isArray(imgs)) {
      data.imageCount = imgs.length
      data.imageUrl = imgs[0]?.url || imgs[0]?.imageUrl || null
      collected.push('imageCount')
    } else if (node.representativeImageUrl || node.representImage?.url) {
      data.imageUrl = node.representativeImageUrl || node.representImage?.url
    }
    // 카테고리
    if (node.category?.wholeCategoryName || node.categoryName) {
      data.category = node.category?.wholeCategoryName || node.categoryName
      collected.push('category')
    }
    // 리뷰
    if (typeof node.reviewAmount?.totalReviewCount === 'number') {
      data.reviewCount = node.reviewAmount.totalReviewCount
      collected.push('reviewCount')
    }
    if (typeof node.reviewAmount?.averageReviewScore === 'number') {
      data.starRating = node.reviewAmount.averageReviewScore
      collected.push('starRating')
    }
  }

  // 2) JSON-LD 폴백 (Product 스키마)
  if (!data.name || data.reviewCount === null) {
    const lds = extractJsonLd(html)
    for (const ld of lds) {
      const arr = Array.isArray(ld) ? ld : [ld]
      for (const obj of arr) {
        if (obj['@type'] === 'Product' || obj.name) {
          if (!data.name && obj.name) {
            data.name = String(obj.name)
            data.nameLength = data.name.length
            if (!collected.includes('name')) collected.push('name')
          }
          if (data.imageUrl === null && obj.image) {
            data.imageUrl = Array.isArray(obj.image) ? obj.image[0] : obj.image
          }
          if (obj.aggregateRating) {
            if (data.starRating === null && obj.aggregateRating.ratingValue) {
              data.starRating = Number(obj.aggregateRating.ratingValue)
              if (!collected.includes('starRating')) collected.push('starRating')
            }
            if (data.reviewCount === null && obj.aggregateRating.reviewCount) {
              data.reviewCount = Number(obj.aggregateRating.reviewCount)
              if (!collected.includes('reviewCount')) collected.push('reviewCount')
            }
          }
          if (data.price === null && obj.offers?.price) {
            data.price = Number(obj.offers.price)
            if (!collected.includes('price')) collected.push('price')
          }
        }
      }
    }
  }

  // 3) 메타 태그 폴백 (og:title 등) — content/property 순서 양방향 매칭
  const metaContent = (prop: string): string | null => {
    const re1 = new RegExp(
      `<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`,
      'i'
    )
    const re2 = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`,
      'i'
    )
    const m = html!.match(re1) || html!.match(re2)
    return m ? m[1] : null
  }

  if (!data.name) {
    const ogt = metaContent('og:title')
    if (ogt) {
      const cleaned = ogt
        .replace(/\s*:\s*네이버.*$/, '')
        .replace(/\s*-\s*네이버.*$/, '')
        .replace(/\s*\|\s*네이버.*$/, '')
        .trim()
      if (cleaned && cleaned !== '네이버' && cleaned.length >= 2) {
        data.name = cleaned
        data.nameLength = data.name.length
        if (!collected.includes('name')) collected.push('name')
      }
    }
  }
  // 대표 이미지 폴백
  if (!data.imageUrl) {
    const ogi = metaContent('og:image')
    if (ogi) data.imageUrl = ogi
  }
  // 카테고리 폴백 (product:category 등)
  if (!data.category) {
    const cat = metaContent('product:category') || metaContent('og:description')
    if (cat && metaContent('product:category')) data.category = cat
  }

  if (collected.length === 0) {
    notes.push('공개 페이지에서 상품 정보를 추출하지 못했어요. 체크리스트로 진단해요.')
  }

  return data
}
