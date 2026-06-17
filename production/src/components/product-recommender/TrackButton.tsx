'use client';
import { useEffect, useState } from 'react';
import styles from './ProductRecommender.module.css';
import { registerTracking, isAlreadyTracked } from '@/lib/recommender/trackingStore';

type Status = 'idle' | 'loading' | 'done' | 'already';

export default function TrackButton({ payload, onRegistered }: {
  payload: {
    productName: string; mainKeyword: string;
    category: string; totalVolume: number; difficulty: number;
  };
  onRegistered?: () => void;
}) {
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    setStatus(isAlreadyTracked(payload.productName) ? 'already' : 'idle');
  }, [payload.productName]);

  const handleClick = async () => {
    if (status === 'loading' || status === 'already') return;
    setStatus('loading');
    try {
      await registerTracking(payload);
      setStatus('done');
      onRegistered?.();
      setTimeout(() => setStatus('already'), 1800);
    } catch {
      setStatus('idle');
    }
  };

  const label = {
    idle: '📌 이 상품명으로 순위추적 등록하기',
    loading: '등록 중…',
    done: '✓ 등록 완료!',
    already: '✓ 이미 추적 중',
  }[status];

  return (
    <button
      className={`${styles.trackBtn} ${status === 'already' || status === 'done' ? styles.trackBtnDone : ''}`}
      onClick={handleClick}
      disabled={status === 'loading' || status === 'already'}
    >
      {label}
      <span className={styles.trackHint}>* 로컬 저장 (셀러랩스 미연동 데모)</span>
    </button>
  );
}
