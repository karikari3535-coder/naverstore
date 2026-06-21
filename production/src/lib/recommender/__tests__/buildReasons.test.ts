import { buildReasons, filterKeywords } from '../engine';
import { DIRTY_KEYWORDS } from './fixtures';

describe('buildReasons', () => {
  const filtered = filterKeywords(DIRTY_KEYWORDS);
  const finalName = '섬국 자연산 홍합탕 통영';

  it('항상 1개 이상의 근거 문장을 생성한다', () => {
    const reasons = buildReasons('섬국', finalName, filtered.valid, filtered);
    expect(reasons.length).toBeGreaterThan(0);
  });

  it('메인 키워드를 언급하는 문장이 첫 번째에 온다', () => {
    const reasons = buildReasons('섬국', finalName, filtered.valid, filtered);
    expect(reasons[0]).toContain('섬국');
  });

  it('제외된 숫자 키워드가 있으면 근거에 반영한다', () => {
    const reasons = buildReasons('섬국', finalName, filtered.valid, filtered);
    expect(reasons.some(r => r.includes('제외'))).toBe(true);
  });

  it('단어 수와 글자 수를 명시한다', () => {
    const reasons = buildReasons('섬국', finalName, filtered.valid, filtered);
    const joined = reasons.join(' ');
    expect(joined).toMatch(/\d+개 단어/);
    expect(joined).toMatch(/\d+자/);
  });
});
