import { buildProductName } from '../engine';
import { TOMATO_KEYWORDS } from './fixtures';

describe('buildProductName', () => {
  it('필수: 메인 키워드를 반드시 포함한다', () => {
    expect(buildProductName('대저토마토', TOMATO_KEYWORDS)).toContain('대저토마토');
  });

  it('브랜드가 있으면 맨 앞에 배치한다', () => {
    expect(buildProductName('대저토마토', TOMATO_KEYWORDS, { brand: '로엘' }).startsWith('로엘')).toBe(true);
  });

  it('단어 수가 maxWords(7개)를 넘지 않는다', () => {
    expect(buildProductName('대저토마토', TOMATO_KEYWORDS, {}, 7).split(' ').length).toBeLessThanOrEqual(7);
  });

  it('전체 길이가 maxLen(50자) 이내다', () => {
    expect(buildProductName('대저토마토', TOMATO_KEYWORDS, {}, 7, 50).length).toBeLessThanOrEqual(50);
  });

  it('중복 단어를 넣지 않는다', () => {
    const words = buildProductName('대저토마토', TOMATO_KEYWORDS).split(' ');
    expect(new Set(words).size).toBe(words.length);
  });

  it('포함관계 단어를 중복 배치하지 않는다', () => {
    const words = buildProductName('토마토', [
      { word: '방울토마토', freq: 10, volume: 18100 },
      { word: '토마토', freq: 5, volume: 121000 },
    ]).split(' ');
    const hasOverlap = words.some((a, i) =>
      words.some((b, j) => i !== j && (a.includes(b) || b.includes(a))));
    expect(hasOverlap).toBe(false);
  });

  it('용량 옵션은 끝에 부착한다', () => {
    const name = buildProductName('대저토마토', TOMATO_KEYWORDS, { volume: '500g' }, 7, 50);
    if (name.includes('500g')) expect(name.endsWith('500g')).toBe(true);
  });

  it('길이 초과 시 용량을 무리하게 붙이지 않는다', () => {
    const name = buildProductName('대저토마토', TOMATO_KEYWORDS, { volume: '아주아주긴용량표기50그램세트구성' }, 7, 50);
    expect(name.length).toBeLessThanOrEqual(50);
  });

  it('동일 입력은 항상 동일 상품명을 낸다 (결정론)', () => {
    expect(buildProductName('대저토마토', TOMATO_KEYWORDS))
      .toBe(buildProductName('대저토마토', TOMATO_KEYWORDS));
  });

  // 골든 테스트: 실제 엔진 출력으로 고정됨 (빈도 60% 가중 → 부산·짭짤이가 상위).
  // 엔진 로직을 의도적으로 바꾸지 않는 한 이 값은 변하지 않아야 한다.
  it('회귀 기준값: 대저토마토 추천 결과 고정', () => {
    expect(buildProductName('대저토마토', TOMATO_KEYWORDS))
      .toBe('대저토마토 부산 짭짤이 방울토마토 완숙 고당도 제철');
  });

  it('키워드가 비어도 메인 키워드만으로 동작한다', () => {
    expect(buildProductName('신안새우', [])).toBe('신안새우');
  });
});
