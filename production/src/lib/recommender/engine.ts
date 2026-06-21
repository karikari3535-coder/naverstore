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

// ═══════════════════════════════════════════════
// [추가] 키워드 성격 분류 → 상품명 배치 순서 + 다단계 이유 (V2)
// ═══════════════════════════════════════════════

/** 네이버 식품 상품명 권장 배치 순서에 맞춘 키워드 역할 */
export type KwRole =
  | 'region'    // 지역 (부산, 통영, 성주)
  | 'variety'   // 품종/브랜드 (대저토마토, 방울토마토, 짭짤이)
  | 'state'     // 상태/당도 (완숙, 고당도, 자연산, 찰)
  | 'usage'     // 용도 (쥬스용, 가정용, 선물용, 캠핑)
  | 'grade'     // 등급 (특품, 못난이, 상급, 프리미엄)
  | 'core'      // 핵심 원물 (메인 키워드 자체)
  | 'etc';      // 기타

const ROLE_DICT: { role: KwRole; words: RegExp }[] = [
  { role: 'region',  words: /(부산|통영|성주|제주|해남|상주|영천|나주|완도|동해|신안|국내산|지역)/ },
  { role: 'variety', words: /(방울토마토|대저토마토|짭짤이|찰토마토|대추|흰다리새우|왕새우|품종|밀키트|세트)/ },
  { role: 'state',   words: /(완숙|고당도|당도|자연산|생|찰|숙성|냉동|건조|국물|진한|손질)$/ },
  { role: 'usage',   words: /(용$|가정|선물|업소|캠핑|반찬|국|탕|구이|찜)/ },
  { role: 'grade',   words: /(특품|특상|상급|최상급|못난이|가성비|프리미엄|등급|호$)/ },
];

/** 배치 우선순위 (작을수록 앞) */
const ROLE_ORDER: Record<KwRole, number> = {
  region: 0, core: 1, variety: 2, state: 3, usage: 4, grade: 5, etc: 6,
};

export function classifyKeyword(word: string, mainKw: string): KwRole {
  if (word === mainKw || mainKw.includes(word)) return 'core';
  for (const { role, words } of ROLE_DICT) {
    if (words.test(word)) return role;
  }
  return 'etc';
}

export interface RoledKeyword extends KeywordStat {
  role: KwRole;
}

/** 점수 정렬된 키워드에 역할을 부여하고, 배치 순서대로 재정렬 */
export function buildRoledName(
  main: string,
  kws: KeywordStat[],
  extras: { brand?: string } = {},
  maxWords = 9,
  maxLen = 50,
): { name: string; roled: RoledKeyword[] } {
  const ranked = scoreKeywords(kws).map(k => ({
    ...k,
    role: classifyKeyword(k.word, main),
  })) as RoledKeyword[];

  // 점수 상위에서 maxWords개 선별 후, 역할 순서로 재배치
  const picked: RoledKeyword[] = [];
  const used = new Set<string>();

  // 메인 키워드를 core로 먼저 확보
  picked.push({ word: main, freq: 0, volume: 0, role: 'core' });
  used.add(main);
  if (extras.brand) { picked.push({ word: extras.brand, freq: 0, volume: 0, role: 'variety' }); used.add(extras.brand); }

  for (const k of ranked) {
    if (picked.length >= maxWords) break;
    if (used.has(k.word)) continue;
    if ([...used].some(u => u.includes(k.word) || k.word.includes(u))) continue;
    picked.push(k); used.add(k.word);
  }

  // 역할 순서 → 같은 역할 내에서는 점수 순
  const ordered = picked.sort((a, b) => {
    const r = ROLE_ORDER[a.role] - ROLE_ORDER[b.role];
    return r !== 0 ? r : (b.score ?? 0) - (a.score ?? 0);
  });

  // 글자수 제한 적용
  const out: RoledKeyword[] = [];
  for (const k of ordered) {
    if ([...out.map(o => o.word), k.word].join(' ').length > maxLen) continue;
    out.push(k);
  }
  return { name: out.map(o => o.word).join(' '), roled: out };
}

/** 레퍼런스 수준의 다단계 최적화 이유 생성 */
export function buildReasonsV2(
  main: string,
  roled: RoledKeyword[],
  excluded: FilteredKeywords,
): string[] {
  const name = roled.map(r => r.word).join(' ');
  const byRole = (role: KwRole) => roled.filter(r => r.role === role).map(r => r.word);
  const idxOf = (w: string) => roled.findIndex(r => r.word === w) + 1;
  const reasons: string[] = [];

  const region = byRole('region');
  if (region.length) {
    reasons.push(`지역 키워드 "${region[0]}"를 맨 앞에 배치했어요. 네이버 쇼핑에서 지역 기반 검색 유입에 유리하고, 산지 신뢰도와 적합도를 함께 높입니다.`);
  }
  reasons.push(`핵심 키워드 "${main}"를 ${idxOf(main)}번째에 배치해 검색 알고리즘의 핵심 매칭 요소를 확보했어요.`);

  const variety = byRole('variety');
  if (variety.length) {
    reasons.push(`품종·상품군 키워드(${variety.join(', ')})를 핵심 키워드 뒤에 두어 구매 의도가 높은 검색어를 폭넓게 커버했어요.`);
  }
  const state = byRole('state');
  if (state.length) {
    reasons.push(`상태·속성 키워드(${state.join(', ')})를 중간에 배치해 상품 특성을 명확히 전달하고 구매 전환을 돕습니다.`);
  }
  const usage = byRole('usage');
  if (usage.length) {
    reasons.push(`용도 키워드(${usage.join(', ')})를 후방에 배치해 가정용·선물용 등 다양한 소비 상황의 검색 유입을 노렸어요.`);
  }
  const grade = byRole('grade');
  if (grade.length) {
    reasons.push(`등급 키워드(${grade.join(', ')})로 상품 품질을 명시해 신뢰도를 높였어요.`);
  }
  reasons.push(`총 ${roled.length}개 단어, ${name.length}자로 구성했어요. 네이버 권장(50자 내외)과 상위권 최적 구간(7~9단어)에 맞췄습니다.`);
  if (excluded.excludedNumeric.length) {
    reasons.push(`숫자·중량 키워드(${excluded.excludedNumeric.slice(0, 3).join(', ')} 등)는 옵션·속성 필드 권장이라 상품명에서 제외했어요.`);
  }
  reasons.push('중복 단어 없이 완성형 키워드만 사용해 네이버 알고리즘의 어뷰즈 감점을 회피했습니다.');
  return reasons;
}
