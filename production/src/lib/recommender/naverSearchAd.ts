import crypto from 'crypto';

const BASE = 'https://api.searchad.naver.com';

// ⚠️ env 는 모듈 로드 시점이 아니라 "함수 호출 시점"에 읽는다.
//    (테스트에서 beforeAll 로 주입한 process.env 가 반영되도록)
function sign(ts: string, method: string, path: string): string {
  return crypto.createHmac('sha256', process.env.NAVER_SECRET_KEY!)
    .update(`${ts}.${method}.${path}`).digest('base64');
}
function adHeaders(method: string, path: string): HeadersInit {
  const ts = Date.now().toString();
  return {
    'X-Timestamp': ts,
    'X-API-KEY': process.env.NAVER_API_KEY!,
    'X-Customer': process.env.NAVER_CUSTOMER_ID!,
    'X-Signature': sign(ts, method, path),
  };
}

export async function getKeywordVolumes(keyword: string) {
  const path = '/keywordstool';
  const qs = new URLSearchParams({ hintKeywords: keyword.replace(/\s/g, ''), showDetail: '1' });
  const res = await fetch(`${BASE}${path}?${qs}`, { headers: adHeaders('GET', path), next: { revalidate: 86400 } } as any);
  if (!res.ok) throw new Error(`검색광고 API ${res.status}`);
  const data = await res.json();

  const toNum = (v: string | number) => Number(String(v).replace('<', '')) || 0;
  return (data.keywordList as any[]).map(k => ({
    word: k.relKeyword as string,
    volume: toNum(k.monthlyPcQcCnt) + toNum(k.monthlyMobileQcCnt),
    compIdx: k.compIdx as string,
  }));
}

export interface ShopItem {
  title: string;
  category1?: string;
  category2?: string;
  category3?: string;
  category4?: string;
}

/** 상위 40개 상품의 원시 정보(제목 정제 + 카테고리)를 반환 */
export async function getTopProducts(keyword: string): Promise<ShopItem[]> {
  const qs = new URLSearchParams({ query: keyword, display: '40', sort: 'sim' });
  const res = await fetch(`https://openapi.naver.com/v1/search/shop.json?${qs}`, {
    headers: {
      'X-Naver-Client-Id': process.env.NAVER_SHOP_ID!,
      'X-Naver-Client-Secret': process.env.NAVER_SHOP_SECRET!,
    },
    next: { revalidate: 3600 },
  } as any);
  if (!res.ok) throw new Error(`쇼핑 API ${res.status}`);
  const data = await res.json();
  return (data.items as any[] ?? []).map(it => ({
    title: String(it.title).replace(/<[^>]+>/g, ''),
    category1: it.category1,
    category2: it.category2,
    category3: it.category3,
    category4: it.category4,
  }));
}

/** 하위 호환: 제목만 필요할 때 */
export async function getTopProductTitles(keyword: string): Promise<string[]> {
  return (await getTopProducts(keyword)).map(it => it.title);
}

/** 상위 상품들의 최빈 카테고리 경로를 산출 */
export function extractCategory(items: ShopItem[]): string {
  const counter: Record<string, number> = {};
  items.forEach(it => {
    const path = [it.category1, it.category2, it.category3, it.category4].filter(Boolean).join(' > ');
    if (path) counter[path] = (counter[path] || 0) + 1;
  });
  const top = Object.entries(counter).sort((a, b) => b[1] - a[1])[0];
  return top?.[0] ?? '미분류';
}

export function extractFrequency(titles: string[]): Record<string, number> {
  const counter: Record<string, number> = {};
  titles.forEach(t => {
    new Set(t.split(/\s+/).filter(w => w.length > 1)).forEach(w => {
      counter[w] = (counter[w] || 0) + 1;
    });
  });
  return counter;
}
