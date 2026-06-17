import { calcDifficulty, verdictOf } from '../engine';
import { EASY_COMPETITION, HARD_COMPETITION, MEDIUM_COMPETITION } from './fixtures';

describe('calcDifficulty', () => {
  it('항상 5~95 범위로 클램핑된다', () => {
    [EASY_COMPETITION, HARD_COMPETITION, MEDIUM_COMPETITION].forEach(c => {
      const d = calcDifficulty(c);
      expect(d).toBeGreaterThanOrEqual(5);
      expect(d).toBeLessThanOrEqual(95);
    });
  });

  it('경쟁 약한 키워드는 난이도가 낮다', () => {
    expect(calcDifficulty(EASY_COMPETITION)).toBeLessThan(35);
  });

  it('경쟁 강한 키워드는 난이도가 높다', () => {
    expect(calcDifficulty(HARD_COMPETITION)).toBeGreaterThanOrEqual(65);
  });

  it('경쟁 요소가 높을수록 난이도가 올라간다 (단조성)', () => {
    expect(calcDifficulty(EASY_COMPETITION)).toBeLessThan(calcDifficulty(MEDIUM_COMPETITION));
    expect(calcDifficulty(MEDIUM_COMPETITION)).toBeLessThan(calcDifficulty(HARD_COMPETITION));
  });

  it('정수를 반환한다', () => {
    expect(Number.isInteger(calcDifficulty(MEDIUM_COMPETITION))).toBe(true);
  });
});

describe('verdictOf', () => {
  it('35 미만은 초록(기회) 판정', () => {
    expect(verdictOf(20).color).toBe('var(--sl-green)');
  });
  it('35~64는 노랑(보통) 판정', () => {
    expect(verdictOf(50).color).toBe('var(--sl-yellow)');
  });
  it('65 이상은 빨강(경쟁심함) 판정', () => {
    expect(verdictOf(80).color).toBe('var(--sl-red)');
  });
  it('경계값 검증', () => {
    expect(verdictOf(34).color).toBe('var(--sl-green)');
    expect(verdictOf(35).color).toBe('var(--sl-yellow)');
    expect(verdictOf(64).color).toBe('var(--sl-yellow)');
    expect(verdictOf(65).color).toBe('var(--sl-red)');
  });
  it('모든 판정에 설명(desc)이 존재한다', () => {
    [10, 50, 90].forEach(s => expect(verdictOf(s).desc.length).toBeGreaterThan(0));
  });
});
