import { scoreKeywords } from '../engine';
import { TOMATO_KEYWORDS } from './fixtures';
import { KeywordStat } from '@/types/recommender';

describe('scoreKeywords', () => {
  it('빈도 60% + 검색량 40% 가중치로 점수를 매긴다', () => {
    const ranked = scoreKeywords(TOMATO_KEYWORDS);
    ranked.forEach(k => {
      expect(k.score).toBeGreaterThanOrEqual(0);
      expect(k.score).toBeLessThanOrEqual(1);
    });
  });

  it('점수 내림차순으로 정렬한다', () => {
    const ranked = scoreKeywords(TOMATO_KEYWORDS);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].score!).toBeGreaterThanOrEqual(ranked[i].score!);
    }
  });

  it('빈도 최상위(부산, freq12)가 1위로 온다', () => {
    expect(scoreKeywords(TOMATO_KEYWORDS)[0].word).toBe('부산');
  });

  it('원본 배열을 변형하지 않는다 (불변성)', () => {
    const snapshot = JSON.stringify(TOMATO_KEYWORDS);
    scoreKeywords(TOMATO_KEYWORDS);
    expect(JSON.stringify(TOMATO_KEYWORDS)).toBe(snapshot);
  });

  it('빈 배열을 안전하게 처리한다', () => {
    expect(scoreKeywords([])).toEqual([]);
  });

  it('원소가 1개면 점수는 1이 된다', () => {
    const single: KeywordStat[] = [{ word: '단일', freq: 5, volume: 100 }];
    expect(scoreKeywords(single)[0].score).toBeCloseTo(1.0);
  });

  it('모든 빈도·검색량이 동일하면 점수도 동일하다', () => {
    const flat: KeywordStat[] = [
      { word: 'a', freq: 5, volume: 100 },
      { word: 'b', freq: 5, volume: 100 },
    ];
    const r = scoreKeywords(flat);
    expect(r[0].score).toBeCloseTo(r[1].score!);
  });
});
