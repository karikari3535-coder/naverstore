import { NextRequest, NextResponse } from 'next/server';
import {
  getKeywordVolumes,
  getTopProducts,
  extractFrequency,
  extractCategory,
} from '@/lib/recommender/naverSearchAd';
import { AnalyzeResult } from '@/types/recommender';

export async function GET(req: NextRequest) {
  const kw = req.nextUrl.searchParams.get('kw');
  if (!kw) return NextResponse.json({ error: '키워드를 입력하세요' }, { status: 400 });

  try {
    const [items, volumes] = await Promise.all([
      getTopProducts(kw),
      getKeywordVolumes(kw),
    ]);

    const titles = items.map(it => it.title);
    const freqMap = extractFrequency(titles);
    const volMap = Object.fromEntries(volumes.map(v => [v.word, v]));

    const keywords = Object.entries(freqMap)
      .map(([word, freq]) => ({ word, freq, volume: volMap[word]?.volume ?? 0 }))
      .filter(k => k.volume > 0)
      .sort((a, b) => b.freq - a.freq)
      .slice(0, 12);

    // ★ 카테고리 자동 산출: 상위 상품들의 최빈 category 경로
    const category = extractCategory(items);

    const bundleRatio =
      titles.filter(t => /\d+\s?kg|세트|묶음|박스/.test(t)).length / (titles.length || 1);
    const mainVol = volMap[kw.replace(/\s/g, '')]?.volume ?? volumes[0]?.volume ?? 0;

    const result: AnalyzeResult = {
      keyword: kw,
      category,
      keywords,
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
