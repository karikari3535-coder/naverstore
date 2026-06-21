import { buildRoledName, buildReasonsV2, classifyKeyword, filterKeywords } from '../engine';
import { DIRTY_KEYWORDS } from './fixtures';

describe('classifyKeyword', () => {
  it('지역 키워드를 region으로 분류한다', () => {
    expect(classifyKeyword('부산', '대저토마토')).toBe('region');
    expect(classifyKeyword('통영', '섬국')).toBe('region');
  });
  it('메인 키워드는 core로 분류한다', () => {
    expect(classifyKeyword('대저토마토', '대저토마토')).toBe('core');
  });
  it('용도 키워드를 usage로 분류한다', () => {
    expect(classifyKeyword('쥬스용', '토마토')).toBe('usage');
  });
  it('등급 키워드를 grade로 분류한다', () => {
    expect(classifyKeyword('특품', '토마토')).toBe('grade');
  });
});

describe('buildRoledName', () => {
  const filtered = filterKeywords(DIRTY_KEYWORDS);

  it('지역 키워드가 핵심 키워드보다 앞에 온다', () => {
    const { name } = buildRoledName('홍합탕', filtered.valid);
    const regionIdx = name.indexOf('통영');
    const coreIdx = name.indexOf('홍합탕');
    if (regionIdx >= 0 && coreIdx >= 0) {
      expect(regionIdx).toBeLessThan(coreIdx);
    }
  });
  it('50자 이내로 생성한다', () => {
    const { name } = buildRoledName('홍합탕', filtered.valid);
    expect(name.length).toBeLessThanOrEqual(50);
  });
  it('roled 배열에 역할이 부여된다', () => {
    const { roled } = buildRoledName('홍합탕', filtered.valid);
    expect(roled.every(r => r.role)).toBe(true);
  });
});

describe('buildReasonsV2', () => {
  const filtered = filterKeywords(DIRTY_KEYWORDS);

  it('지역 키워드가 있으면 첫 이유에 지역을 언급한다', () => {
    const { roled } = buildRoledName('홍합탕', filtered.valid);
    const reasons = buildReasonsV2('홍합탕', roled, filtered);
    expect(reasons[0]).toMatch(/지역|통영/);
  });
  it('5개 이상의 다단계 이유를 생성한다', () => {
    const { roled } = buildRoledName('홍합탕', filtered.valid);
    const reasons = buildReasonsV2('홍합탕', roled, filtered);
    expect(reasons.length).toBeGreaterThanOrEqual(5);
  });
});
