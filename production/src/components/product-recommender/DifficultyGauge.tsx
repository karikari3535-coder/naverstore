'use client';
import { useEffect, useState } from 'react';
import styles from './ProductRecommender.module.css';
import { verdictOf } from '@/lib/recommender/engine';

export default function DifficultyGauge({ score, oppKeywords }: { score: number; oppKeywords: string[] }) {
  const [pos, setPos] = useState(0);
  useEffect(() => { const t = setTimeout(() => setPos(score), 50); return () => clearTimeout(t); }, [score]);
  const v = verdictOf(score);

  return (
    <div className={styles.gaugeBox}>
      <h4 className={styles.metaH4}>📊 진입 난이도</h4>
      <div className={styles.gaugeHead}>
        <span className={styles.verdict} style={{ color: v.color }}>{v.label}</span>
        <span className={styles.gaugeScore}>난이도 {score}/100</span>
      </div>
      <div className={styles.gaugeTrack}>
        <div className={styles.gaugeNeedle} style={{ left: `${pos}%` }} />
      </div>
      <div className={styles.gaugeLabels}><span>쉬움</span><span>보통</span><span>어려움</span></div>
      <div className={styles.gaugeDesc}>{v.desc}</div>
      {score >= 65 && (
        <div className={styles.oppKw}>
          <span className={styles.oppLabel}>💡 기회 키워드 →</span>
          {oppKeywords.map(k => <span key={k} className={styles.pillGreen}>{k}</span>)}
        </div>
      )}
    </div>
  );
}
