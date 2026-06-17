/** @jest-environment jsdom */
import { registerTracking, getTrackedItems, removeTracking, isAlreadyTracked } from '../trackingStore';

beforeEach(() => localStorage.clear());

const sample = {
  productName: '대저토마토 부산 방울토마토 고당도',
  mainKeyword: '대저토마토', category: '식품>토마토',
  totalVolume: 50000, difficulty: 20,
};

describe('trackingStore (로컬 목업)', () => {
  it('등록하면 목록에 추가된다', async () => {
    await registerTracking(sample);
    expect(getTrackedItems()).toHaveLength(1);
  });

  it('등록 항목에 id와 createdAt이 채워진다', async () => {
    const saved = await registerTracking(sample);
    expect(saved.id).toMatch(/^local_/);
    expect(saved.createdAt).toBeTruthy();
  });

  it('중복 상품명 등록 여부를 판별한다', async () => {
    await registerTracking(sample);
    expect(isAlreadyTracked(sample.productName)).toBe(true);
    expect(isAlreadyTracked('다른 상품명')).toBe(false);
  });

  it('삭제하면 목록에서 빠진다', async () => {
    const saved = await registerTracking(sample);
    removeTracking(saved.id);
    expect(getTrackedItems()).toHaveLength(0);
  });
});
