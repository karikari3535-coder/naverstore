'use client';
import styles from './ProductRecommender.module.css';
import { RecommendMode } from '@/types/recommender';

const MODES: { key: RecommendMode; label: string }[] = [
  { key: 'quick', label: '⚡ 빠른 추천' },
  { key: 'complete', label: '🎯 완벽 최적화' },
  { key: 'competition', label: '📊 경쟁률 분석' },
];

export default function ModeTabs({ mode, onChange }: {
  mode: RecommendMode; onChange: (m: RecommendMode) => void;
}) {
  return (
    <div className={styles.modes}>
      {MODES.map(m => (
        <button key={m.key}
          className={`${styles.modeBtn} ${mode === m.key ? styles.modeBtnActive : ''}`}
          onClick={() => onChange(m.key)}>
          {m.label}
        </button>
      ))}
    </div>
  );
}
