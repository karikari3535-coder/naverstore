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
