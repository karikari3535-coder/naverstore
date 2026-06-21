'use client';
import { useMemo } from 'react';
import styles from './ProductRecommender.module.css';
import DifficultyGauge from './DifficultyGauge';
import VersusCompare from './VersusCompare';
import TrackButton from './TrackButton';
import { calcDifficulty, filterKeywords } from '@/lib/recommender/engine';
import { AnalyzeResult, RecommendMode } from '@/types/recommender';

export default function ResultCard({ data, name, mode, currentName, onRegistered }: {
  data: AnalyzeResult; name: string; mode: RecommendMode;
  currentName: string; onRegistered?: () => void;
}) {
  const used = name.split(' ').filter(Boolean);

  // ★ 상품명과 동일하게 "필터링된 키워드" 기준으로 통일
  const validKeywords = useMemo(
    () => filterKeywords(data.keywords).valid,
    [data.keywords],
  );
  const bars = validKeywords.filter(k => used.includes(k.word));
  const maxV = Math.max(...bars.map(b => b.volume), 1);
  const total = useMemo(() => bars.reduce((s, b) => s + b.volume, 0), [bars]);
  const diff = calcDifficulty(data.competition);

  const copy = (t: string, e: React.MouseEvent<HTMLButtonElement>) => {
    navigator.clipboard.writeText(t);
    const btn = e.currentTarget, o = btn.textContent;
    btn.textContent = '복사됨 ✓'; setTimeout(() => { btn.textContent = o; }, 1500);
  };

  return (
    <div className={styles.result}>
      {mode === 'complete' && currentName
        ? <VersusCompare current={currentName} recommended={name} total={total} onCopy={copy} />
        : (
          <div className={`${styles.vsCol} ${styles.vsNew}`} style={{ marginBottom: 20 }}>
            <div className={styles.vsTagNew}>추천 상품명</div>
            <div className={styles.vsTxtNew}>{name}</div>
            <button className={styles.copyBtn} onClick={e => copy(name, e)}>복사하기</button>
          </div>
        )}

      <TrackButton
        payload={{
          productName: name,
          mainKeyword: data.keyword,
          category: data.category,
          totalVolume: total,
          difficulty: diff,
        }}
        onRegistered={onRegistered}
      />

      {(mode === 'competition' || mode === 'complete') && (
        <DifficultyGauge score={diff} oppKeywords={data.oppKeywords} />
      )}

      <div className={styles.metaGrid}>
        <div className={styles.metaBox}>
          <h4 className={styles.metaH4}>📈 키워드별 검색량</h4>
          {bars.map(b => (
            <div key={b.word} className={styles.kwBar}>
              <div className={styles.kwTop}><span>{b.word}</span><b>{b.volume.toLocaleString()}회</b></div>
              <div className={styles.kwTrack}>
                <div className={styles.kwFill} style={{ width: `${(b.volume / maxV) * 100}%` }} />
              </div>
            </div>
          ))}
          <div className={styles.totalVol}>총 노출 검색량 <b>{total.toLocaleString()}회</b></div>
        </div>
        <div className={styles.metaBox}>
          <h4 className={styles.metaH4}>🗂 추천 카테고리</h4>
          <span className={styles.pill}>{data.category}</span>
          <h4 className={styles.metaH4} style={{ marginTop: 16 }}>🏷 추천 태그</h4>
          {[...data.extraTags, ...validKeywords.filter(k => !used.includes(k.word)).map(k => k.word)]
            .slice(0, 10).map(t => <span key={t} className={styles.pill}>{t}</span>)}
        </div>
      </div>

      {mode !== 'quick' && data.reasons && data.reasons.length > 0 && (
        <div className={styles.reason}>
          <h4 className={styles.metaH4}>💡 왜 이 상품명일까요?</h4>
          <ol className={styles.reasonList}>
            {data.reasons.map((r, i) => <li key={i}>{r}</li>)}
          </ol>
        </div>
      )}
    </div>
  );
}
