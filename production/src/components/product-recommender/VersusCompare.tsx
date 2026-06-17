'use client';
import styles from './ProductRecommender.module.css';

export default function VersusCompare({ current, recommended, total, onCopy }: {
  current: string; recommended: string; total: number;
  onCopy: (t: string, e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const curEst = Math.round(total * 0.35);
  return (
    <div className={styles.vs}>
      <div className={`${styles.vsCol} ${styles.vsOld}`}>
        <div className={styles.vsTagOld}>현재 상품명</div>
        <div className={styles.vsTxtOld}>{current}</div>
        <div className={styles.vsDelta}>추정 노출 검색량 {curEst.toLocaleString()}회</div>
      </div>
      <div className={styles.vsArrow}>→</div>
      <div className={`${styles.vsCol} ${styles.vsNew}`}>
        <div className={styles.vsTagNew}>추천 상품명</div>
        <div className={styles.vsTxtNew}>{recommended}</div>
        <div className={`${styles.vsDelta} ${styles.vsUp}`}>
          ▲ {(total - curEst).toLocaleString()}회 상승 ({total.toLocaleString()}회)
        </div>
        <button className={styles.copyBtn} onClick={e => onCopy(recommended, e)}>복사하기</button>
      </div>
    </div>
  );
}
