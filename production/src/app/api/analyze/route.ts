import { NextRequest, NextResponse } from 'next/server';
import {
  getKeywordVolumes,
  getTopProducts,
  extractFrequency,
  extractCategory,
} from '@/lib/recommender/naverSearchAd';
import {
  scoreKeywords,
  buildProductName,
  filterKeywords,        // ★ 추가
  lengthDistribution,    // ★ 추가
  buildReasons,          // ★ 추가
} from '@/lib/recommender/engine';
import { AnalyzeResult } from '@/types/recommender';

export async function GET(req: NextRequest) {
  const kw = req.nextUrl.searchParams.get('kw');
  const brand = req.nextUrl.searchParams.get('brand') ?? undefined;
  if (!kw) return NextResponse.json({ error: '키워드를 입력하세요' }, { status: 400 });

  try {
    const [items, volumes] = await Promise.all([
      getTopProducts(kw),
      getKeywordVolumes(kw),
    ]);

    const titles = items.map(it => it.title);
    const freqMap = extractFrequency(titles);
    const volMap = Object.fromEntries(volumes.map(v => [v.word, v]));

    const rawKeywords = Object.entries(freqMap)
      .map(([word, freq]) => ({ word, freq, volume: volMap[word]?.volume ?? 0 }))
      .filter(k => k.volume > 0)
      .sort((a, b) => b.freq - a.freq);

    // ★ 숫자/수식어 필터링
    const filtered = filterKeywords(rawKeywords);
    const keywords = filtered.valid.slice(0, 12);

    // ★ 상품명 생성 + 배치 근거
    const finalName = buildProductName(kw, keywords, { brand });
    const reasons = buildReasons(kw, finalName, keywords, filtered);

    // ★ 단어 수 분포
    const lengthDist = lengthDistribution(titles);

    const category = extractCategory(items);
    const bundleRatio =
      titles.filter(t => /\d+\s?kg|세트|묶음|박스/.test(t)).length / (titles.length || 1);
    const mainVol = volMap[kw.replace(/\s/g, '')]?.volume ?? volumes[0]?.volume ?? 0;

    const result: AnalyzeResult = {
      keyword: kw,
      category,
      productName: finalName,   // ★ 추가
      reasons,                  // ★ 추가
      keywords,
      lengthDist,               // ★ 추가
      excludedKeywords: {       // ★ 추가
        numeric: filtered.excludedNumeric,
        promo: filtered.excludedPromo,
      },
      competition: {
        bundleRatio,
        avgReview: 1.2,
        totalProducts: titles.length,
        searchVolume: mainVol,
      },
      extraTags: keywords.slice(7).map(k => k.word),
      oppKeywords: volumes.filter(v => v.compIdx === '낮음').slice(0, 3).map(v => v.word),
    };
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: 'API 호출 실패', detail: e.message }, { status: 500 });
  }
}
