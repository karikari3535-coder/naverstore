'use client';
import { useState, useCallback } from 'react';
import styles from './ProductRecommender.module.css';
import ModeTabs from './ModeTabs';
import ResultCard from './ResultCard';
import TrackedList from './TrackedList';
import { buildRoledName, buildReasonsV2, filterKeywords } from '@/lib/recommender/engine';
import { AnalyzeResult, RecommendMode } from '@/types/recommender';

const DEMO: AnalyzeResult = {
  keyword: '대저토마토',
  category: '식품 > 농산물 > 과일 > 토마토',
  keywords: [
    { word: '부산', freq: 12, volume: 14800 }, { word: '방울토마토', freq: 5, volume: 18100 },
    { word: '고당도', freq: 6, volume: 8100 }, { word: '제철', freq: 4, volume: 9900 },
    { word: '짭짤이', freq: 11, volume: 3200 }, { word: '완숙', freq: 8, volume: 2900 },
    { word: '대추', freq: 5, volume: 5400 }, { word: '찰', freq: 5, volume: 1600 },
  ],
  competition: { bundleRatio: 0, avgReview: 1.2, totalProducts: 40, searchVolume: 4680 },
  extraTags: ['스테비아토마토', '못난이토마토', '흑토마토', '산지직송', '유럽종완숙'],
  oppKeywords: ['흑대추방울토마토', '부산대저', '짭짜리'],
};

// 데모 결과에도 V2 로직을 적용해 productName / reasons를 미리 채워둔다
function withV2(result: AnalyzeResult, kw: string, brand?: string): AnalyzeResult {
  // 서버가 이미 V2 결과를 주면 그대로 사용
  if (result.productName && result.reasons?.length) return result;
  const filtered = filterKeywords(result.keywords);
  const { name, roled } = buildRoledName(kw, filtered.valid, { brand });
  return {
    ...result,
    productName: name,
    reasons: buildReasonsV2(kw, roled, filtered),
    excludedKeywords: result.excludedKeywords ?? {
      numeric: filtered.excludedNumeric,
      promo: filtered.excludedPromo,
    },
  };
}

export default function ProductRecommender() {
  const [mode, setMode] = useState<RecommendMode>('quick');
  const [kw, setKw] = useState('대저토마토');
  const [brand, setBrand] = useState('');
  const [volume, setVolume] = useState('');
  const [currentName, setCurrentName] = useState('');
  const [data, setData] = useState<AnalyzeResult | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackRefresh, setTrackRefresh] = useState(0);

  const generate = useCallback(async () => {
    if (!kw.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/analyze?kw=${encodeURIComponent(kw)}`);
      const raw: AnalyzeResult = res.ok ? await res.json() : DEMO;
      const result = withV2(raw, kw, brand || undefined);
      setData(result);
      setName(result.productName ?? '');
    } catch {
      const result = withV2(DEMO, kw, brand || undefined);
      setData(result);
      setName(result.productName ?? '');
    } finally {
      setLoading(false);
    }
  }, [kw, brand, volume]);

  return (
    <div className={styles.tool}>
      <ModeTabs mode={mode} onChange={setMode} />

      <label className={styles.label}>상품 메인 키워드</label>
      <div className={styles.inputRow}>
        <input className={styles.input} value={kw} onChange={e => setKw(e.target.value)}
               placeholder="예) 새우 ✗ / 신안 새우 ✓"
               onKeyDown={e => e.key === 'Enter' && generate()} />
        <button className={styles.btn} onClick={generate} disabled={loading}>
          {loading ? '분석 중…' : '상품명 생성'}
        </button>
      </div>

      {mode === 'complete' && (
        <>
          <div className={styles.extra}>
            <input className={styles.extraInput} placeholder="브랜드 (선택)"
                   value={brand} onChange={e => setBrand(e.target.value)} />
            <input className={styles.extraInput} placeholder="용량/수량 (선택, 예: 500g)"
                   value={volume} onChange={e => setVolume(e.target.value)} />
          </div>
          <label className={styles.label} style={{ marginTop: 14 }}>현재 상품명 (비교용, 선택)</label>
          <input className={styles.currentInput} value={currentName}
                 onChange={e => setCurrentName(e.target.value)}
                 placeholder="예) 토마토 방울토마토 맛있는 토마토 판매" />
        </>
      )}

      {data && (
        <ResultCard
          data={data} name={name} mode={mode} currentName={currentName}
          onRegistered={() => setTrackRefresh(k => k + 1)}
        />
      )}

      <TrackedList refreshKey={trackRefresh} />
    </div>
  );
}
