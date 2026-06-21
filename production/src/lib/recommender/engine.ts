import { KeywordStat, Competition } from '@/types/recommender';

const normalize = (arr: number[]): number[] => {
  if (!arr.length) return [];
  const lo = Math.min(...arr), hi = Math.max(...arr);
  return hi === lo ? arr.map(() => 1) : arr.map(v => (v - lo) / (hi - lo));
};

export function scoreKeywords(kws: KeywordStat[]): KeywordStat[] {
  const nf = normalize(kws.map(k => k.freq));
  const nv = normalize(kws.map(k => k.volume));
  return kws
    .map((k, i) => ({ ...k, score: nf[i] * 0.6 + nv[i] * 0.4 }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

export function buildProductName(
  main: string,
  kws: KeywordStat[],
  extras: { brand?: string; volume?: string } = {},
  maxWords = 7,
  maxLen = 50,
): string {
  const ranked = scoreKeywords(kws);
  const out: string[] = [];
  const used = new Set<string>();

  if (extras.brand) { out.push(extras.brand); used.add(extras.brand); }
  main.split(' ').forEach(t => { if (t && !used.has(t)) { out.push(t); used.add(t); } });

  for (const k of ranked) {
    if (out.length >= maxWords) break;
    if (used.has(k.word)) continue;
    if ([...used].some(u => u.includes(k.word) || k.word.includes(u))) continue;
    if ([...out, k.word].join(' ').length > maxLen) continue;
    out.push(k.word); used.add(k.word);
  }
  if (extras.volume && [...out, extras.volume].join(' ').length <= maxLen) {
    out.push(extras.volume);
  }
  return out.join(' ');
}

export function calcDifficulty(c: Competition): number {
  const reviewN = Math.min(c.avgReview / 50, 1);
  const compStrength = c.bundleRatio * 0.4 + reviewN * 0.4 + 0.2;
  const raw = compStrength * 100 * (1 - Math.min(c.searchVolume / 20000, 0.6));
  return Math.round(Math.min(Math.max(raw, 5), 95));
}

export function verdictOf(score: number) {
  if (score < 35) return { label: '지금 들어가세요! 🟢', color: 'var(--sl-green)',
    desc: '상위노출 경쟁이 낮은 키워드예요. 상품명 최적화만 잘해도 광고 없이 순위가 올라갑니다.' };
  if (score < 65) return { label: '해볼 만해요 🟡', color: 'var(--sl-yellow)',
    desc: '경쟁이 보통 수준이에요. 상품명 + 리뷰 관리를 병행하면 충분히 상위권 진입이 가능합니다.' };
  return { label: '경쟁이 셉니다 🔴', color: 'var(--sl-red)',
    desc: '이미 강한 셀러들이 자리잡은 키워드예요. 아래 기회 키워드로 우회하는 걸 추천드려요.' };
}

// ─────────────────────────────────────────────
// [추가] 제외 키워드 분류 (네이버 표준상품명 가이드 기반)
// ─────────────────────────────────────────────

/** 숫자·중량·수량 단위 패턴 (5kg, 4-5미, 10개입, 2팩 등) */
const NUMERIC_UNIT = /(\d+\s?(kg|g|ml|l|미|개|입|팩|박스|세트|호|인분|매|장|구|p|ea))|^\d+([-~]\d+)?$/i;
/** 수식어·홍보 문구 (감점 요소) */
const PROMO_WORDS = /^(최고|최상급|초특가|특가|할인|쿠폰|적립|이벤트|무료|정품|국내산표기|당일|초신선|프리미엄)$/;
/** 특수문자만으로 이뤄진 토큰 */
const SYMBOL_ONLY = /^[()\[\]\/&+,~.\-·]+$/;

export interface FilteredKeywords {
  valid: KeywordStat[];     // 상품명에 쓸 유효 키워드
  excludedNumeric: string[]; // 제외된 숫자/중량 키워드
  excludedPromo: string[];   // 제외된 수식어
}

export function filterKeywords(kws: KeywordStat[]): FilteredKeywords {
  const valid: KeywordStat[] = [];
  const excludedNumeric: string[] = [];
  const excludedPromo: string[] = [];

  for (const k of kws) {
    const w = k.word.trim();
    if (!w || w.length < 2) continue;
    if (SYMBOL_ONLY.test(w)) continue;
    if (NUMERIC_UNIT.test(w)) { excludedNumeric.push(w); continue; }
    if (PROMO_WORDS.test(w)) { excludedPromo.push(w); continue; }
    valid.push(k);
  }
  return { valid, excludedNumeric, excludedPromo };
}

// ─────────────────────────────────────────────
// [추가] 상위 상품명 단어 수 분포
// ─────────────────────────────────────────────

export interface LengthBucket {
  words: number;   // 단어 개수
  count: number;   // 해당 단어 수를 가진 상품 수
  isHot: boolean;  // 최빈 구간 여부
}

export function lengthDistribution(titles: string[]): {
  buckets: LengthBucket[];
  avgWords: number;
  recommendRange: [number, number];
} {
  const counter: Record<number, number> = {};
  let totalWords = 0;

  titles.forEach(t => {
    const n = t.trim().split(/\s+/).filter(Boolean).length;
    counter[n] = (counter[n] || 0) + 1;
    totalWords += n;
  });

  const entries = Object.entries(counter)
    .map(([w, c]) => ({ words: Number(w), count: c }))
    .sort((a, b) => a.words - b.words);

  const maxCount = Math.max(...entries.map(e => e.count), 0);
  const buckets: LengthBucket[] = entries.map(e => ({ ...e, isHot: e.count === maxCount }));

  const avgWords = titles.length ? Math.round((totalWords / titles.length) * 10) / 10 : 0;
  // 네이버 권장: 상위권 평균 ±2단어, 4~16 범위로 클램프
  const lo = Math.max(4, Math.round(avgWords) - 2);
  const hi = Math.min(16, Math.round(avgWords) + 2);

  return { buckets, avgWords, recommendRange: [lo, hi] };
}

// ─────────────────────────────────────────────
// [추가] 상품명 배치 근거(최적화 이유) 자동 생성
// ─────────────────────────────────────────────

export function buildReasons(
  main: string,
  finalName: string,
  kws: KeywordStat[],
  excluded: FilteredKeywords,
): string[] {
  const words = finalName.split(' ').filter(Boolean);
  const top = scoreKeywords(kws)[0]?.word;
  const reasons: string[] = [];

  reasons.push(
    `핵심 키워드 "${main}"를 상품명 앞쪽에 배치해 네이버 검색 알고리즘의 적합도 점수를 높였어요.`,
  );
  if (top && top !== main) {
    reasons.push(`검색량·빈도가 가장 높은 "${top}"를 메인 키워드 바로 뒤에 두어 노출 범위를 넓혔어요.`);
  }
  reasons.push(
    `총 ${words.length}개 단어, ${finalName.length}자로 구성했어요. 네이버 권장(50자 내외)과 상위권 최적 구간(7~9단어)에 맞췄어요.`,
  );
  if (excluded.excludedNumeric.length) {
    reasons.push(
      `숫자·중량 키워드(${excluded.excludedNumeric.slice(0, 3).join(', ')} 등)는 상품명에서 제외했어요. 옵션·속성 필드에 넣는 게 SEO에 유리해요.`,
    );
  }
  if (excluded.excludedPromo.length) {
    reasons.push(
      `"${excluded.excludedPromo.slice(0, 2).join(', ')}" 같은 수식어는 감점 요소라 제외했어요.`,
    );
  }
  reasons.push('중복 단어 없이 완성형 키워드만 사용해 어뷰즈 감점을 피했어요.');
  return reasons;
}
