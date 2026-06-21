import { lengthDistribution } from '../engine';
import { SAMPLE_TITLES } from './fixtures';

describe('lengthDistribution', () => {
  it('단어 수별로 상품 개수를 집계한다', () => {
    const { buckets } = lengthDistribution(SAMPLE_TITLES);
    const map = Object.fromEntries(buckets.map(b => [b.words, b.count]));
    expect(map[5]).toBe(1); // 5단어 1개
    expect(map[6]).toBe(1); // 6단어 1개
    expect(map[7]).toBe(2); // 7단어 2개
    expect(map[8]).toBe(1); // 8단어 1개
  });

  it('buckets는 단어 수 오름차순으로 정렬된다', () => {
    const { buckets } = lengthDistribution(SAMPLE_TITLES);
    for (let i = 1; i < buckets.length; i++) {
      expect(buckets[i].words).toBeGreaterThan(buckets[i - 1].words);
    }
  });

  it('최빈 구간(7단어)에 isHot=true를 표시한다', () => {
    const { buckets } = lengthDistribution(SAMPLE_TITLES);
    const hot = buckets.filter(b => b.isHot);
    expect(hot).toHaveLength(1);
    expect(hot[0].words).toBe(7);
  });

  it('평균 단어 수를 소수점 1자리로 계산한다', () => {
    // (6+7+7+5+8)/5 = 6.6
    expect(lengthDistribution(SAMPLE_TITLES).avgWords).toBeCloseTo(6.6);
  });

  it('추천 범위는 평균 ±2단어이며 4~16으로 클램프된다', () => {
    const { recommendRange } = lengthDistribution(SAMPLE_TITLES);
    expect(recommendRange[0]).toBeGreaterThanOrEqual(4);
    expect(recommendRange[1]).toBeLessThanOrEqual(16);
    expect(recommendRange[0]).toBeLessThan(recommendRange[1]);
  });

  it('빈 배열을 안전하게 처리한다', () => {
    const r = lengthDistribution([]);
    expect(r.buckets).toEqual([]);
    expect(r.avgWords).toBe(0);
  });
});
