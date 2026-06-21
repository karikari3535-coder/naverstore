'use client';
import { useMemo } from 'react';
import styles from './ProductRecommender.module.css';
import DifficultyGauge from './DifficultyGauge';
import VersusCompare from './VersusCompare';
import TrackButton from './TrackButton';
import { calcDifficulty } from '@/lib/recommender/engine';
import { AnalyzeResult, RecommendMode } from '@/types/recommender';

export default function ResultCard({ data, name, mode, currentName, onRegistered }: {
  data: AnalyzeResult; name: string; mode: RecommendMode;
  currentName: string; onRegistered?: () => void;
}) {
  const used = name.split(' ');
  const bars = data.keywords.filter(k => used.includes(k.word));
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
          {[...data.extraTags, ...data.keywords.filter(k => !used.includes(k.word)).map(k => k.word)]
            .slice(0, 10).map(t => <span key={t} className={styles.pill}>{t}</span>)}
        </div>
      </div>

      {mode !== 'quick' && (
        <div className={styles.reason}>
          <h4 className={styles.metaH4}>💡 왜 이 상품명일까요?</h4>
          <ol className={styles.reasonList}>
            {(data.reasons && data.reasons.length
              ? data.reasons
              : [`필수 키워드 "${data.keyword}" 포함`, '상위노출 빈도 1위 키워드 우선 배치',
                 '검색량 최상위 키워드 결합으로 노출 확대', '동일 단어 비연속 배치로 SEO 패널티 회피',
                 `${used.length}개 단어 사용 (네이버 권장 7개 내외)`, '특수문자 0개 · 50자 이내 준수']
            ).map((r, i) => <li key={i}>{r}</li>)}
          </ol>
        </div>
      )}
    </div>
  );
}
