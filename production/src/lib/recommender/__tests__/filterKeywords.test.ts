import { filterKeywords } from '../engine';
import { DIRTY_KEYWORDS } from './fixtures';
import { KeywordStat } from '@/types/recommender';

describe('filterKeywords', () => {
  it('숫자·중량·수량 키워드를 excludedNumeric으로 분리한다', () => {
    const { excludedNumeric } = filterKeywords(DIRTY_KEYWORDS);
    expect(excludedNumeric).toEqual(
      expect.arrayContaining(['5kg', '4-5미', '10개입']),
    );
  });

  it('수식어·홍보 문구를 excludedPromo로 분리한다', () => {
    const { excludedPromo } = filterKeywords(DIRTY_KEYWORDS);
    expect(excludedPromo).toContain('특가');
  });

  it('특수문자만 있는 토큰과 1글자 토큰은 어디에도 포함하지 않는다', () => {
    const r = filterKeywords(DIRTY_KEYWORDS);
    const allWords = [
      ...r.valid.map(k => k.word),
      ...r.excludedNumeric,
      ...r.excludedPromo,
    ];
    expect(allWords).not.toContain('/');
    expect(allWords).not.toContain('동'); // 1글자
  });

  it('유효 키워드만 valid에 남긴다 (완성형 단어)', () => {
    const { valid } = filterKeywords(DIRTY_KEYWORDS);
    const words = valid.map(k => k.word);
    expect(words).toEqual(
      expect.arrayContaining(['섬국', '자연산', '홍합탕', '통영']),
    );
    expect(words).not.toContain('5kg');
    expect(words).not.toContain('특가');
  });

  it('valid + 제외목록의 총합이 원본 길이를 넘지 않는다 (중복 분류 없음)', () => {
    const r = filterKeywords(DIRTY_KEYWORDS);
    const total = r.valid.length + r.excludedNumeric.length + r.excludedPromo.length;
    expect(total).toBeLessThanOrEqual(DIRTY_KEYWORDS.length);
  });

  it('빈 배열을 안전하게 처리한다', () => {
    const r = filterKeywords([]);
    expect(r.valid).toEqual([]);
    expect(r.excludedNumeric).toEqual([]);
    expect(r.excludedPromo).toEqual([]);
  });

  it('원본 배열을 변형하지 않는다 (불변성)', () => {
    const snapshot = JSON.stringify(DIRTY_KEYWORDS);
    filterKeywords(DIRTY_KEYWORDS);
    expect(JSON.stringify(DIRTY_KEYWORDS)).toBe(snapshot);
  });

  it('순수 숫자/범위 토큰(예: 123, 4~5)도 숫자로 분류한다', () => {
    const kws: KeywordStat[] = [
      { word: '123', freq: 1, volume: 10 },
      { word: '정상키워드', freq: 1, volume: 10 },
    ];
    const r = filterKeywords(kws);
    expect(r.excludedNumeric).toContain('123');
    expect(r.valid.map(k => k.word)).toContain('정상키워드');
  });
});
