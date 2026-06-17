// ⚠️ 로컬 목업 — 셀러랩스 서버와 연동되지 않습니다.
//    추후 실제 연동 시 registerTracking 함수 본문만 fetch 호출로 교체하면 됩니다.

export interface TrackedItem {
  id: string;
  productName: string;
  mainKeyword: string;
  category: string;
  totalVolume: number;
  difficulty: number;
  createdAt: string;
}

const KEY = 'sl_tracked_products';

export function getTrackedItems(): TrackedItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function isAlreadyTracked(productName: string): boolean {
  return getTrackedItems().some(i => i.productName === productName);
}

export async function registerTracking(
  item: Omit<TrackedItem, 'id' | 'createdAt'>,
): Promise<TrackedItem> {
  // TODO: 셀러랩스 순위추적 API 연결
  //   const res = await fetch('https://sellerlabs.co.kr/api/ranking-track', {
  //     method: 'POST', headers: {...auth}, body: JSON.stringify(item) });
  //   return res.json();

  await new Promise(r => setTimeout(r, 600));

  const saved: TrackedItem = {
    ...item,
    id: `local_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const list = getTrackedItems();
  list.unshift(saved);
  localStorage.setItem(KEY, JSON.stringify(list));
  return saved;
}

export function removeTracking(id: string): void {
  const list = getTrackedItems().filter(i => i.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
}
