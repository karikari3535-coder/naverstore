'use client';
import { useEffect, useState } from 'react';
import styles from './ProductRecommender.module.css';
import { getTrackedItems, removeTracking, TrackedItem } from '@/lib/recommender/trackingStore';

export default function TrackedList({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<TrackedItem[]>([]);

  useEffect(() => { setItems(getTrackedItems()); }, [refreshKey]);

  const handleRemove = (id: string) => {
    removeTracking(id);
    setItems(getTrackedItems());
  };

  if (!items.length) return null;

  return (
    <div className={styles.trackedPanel}>
      <h4 className={styles.metaH4}>📋 내 추적 목록 ({items.length})</h4>
      {items.map(it => (
        <div key={it.id} className={styles.trackedRow}>
          <div>
            <div className={styles.trackedName}>{it.productName}</div>
            <div className={styles.trackedMeta}>
              검색량 {it.totalVolume.toLocaleString()}회 · 난이도 {it.difficulty} ·{' '}
              {new Date(it.createdAt).toLocaleDateString('ko-KR')}
            </div>
          </div>
          <button className={styles.trackedDel} onClick={() => handleRemove(it.id)}>삭제</button>
        </div>
      ))}
    </div>
  );
}
