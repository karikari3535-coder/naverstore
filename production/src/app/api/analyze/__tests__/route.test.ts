import { GET } from '../route';
import { NextRequest } from 'next/server';

beforeAll(() => {
  process.env.NAVER_API_KEY = 'test-key';
  process.env.NAVER_SECRET_KEY = 'test-secret';
  process.env.NAVER_CUSTOMER_ID = 'test-customer';
  process.env.NAVER_SHOP_ID = 'test-shop-id';
  process.env.NAVER_SHOP_SECRET = 'test-shop-secret';
});

const callGET = (kw?: string) =>
  GET(new NextRequest(kw
    ? `http://localhost/api/analyze?kw=${encodeURIComponent(kw)}`
    : 'http://localhost/api/analyze'));

describe('GET /api/analyze — 정상 경로', () => {
  it('200과 분석 결과 구조를 반환한다', async () => {
    const res = await callGET('대저토마토');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.keyword).toBe('대저토마토');
    expect(Array.isArray(body.keywords)).toBe(true);
    expect(Array.isArray(body.oppKeywords)).toBe(true);
    expect(typeof body.category).toBe('string');
    expect(body.competition).toEqual(
      expect.objectContaining({
        bundleRatio: expect.any(Number),
        totalProducts: expect.any(Number),
        searchVolume: expect.any(Number),
      }),
    );
  });

  it('PC + 모바일 검색량을 합산한다 (부산=14800)', async () => {
    const body = await (await callGET('대저토마토')).json();
    expect(body.keywords.find((k: any) => k.word === '부산').volume).toBe(14800);
  });

  it('title의 HTML 태그를 제거하고 빈도를 센다', async () => {
    const body = await (await callGET('대저토마토')).json();
    const busan = body.keywords.find((k: any) => k.word === '부산');
    expect(busan).toBeDefined();
    expect(busan.freq).toBeGreaterThan(0);
  });

  it('검색량 0인 키워드는 제외한다', async () => {
    const body = await (await callGET('대저토마토')).json();
    expect(body.keywords.every((k: any) => k.volume > 0)).toBe(true);
  });

  it('묶음상품 비율을 계산한다', async () => {
    const body = await (await callGET('대저토마토')).json();
    expect(body.competition.bundleRatio).toBeGreaterThan(0);
    expect(body.competition.bundleRatio).toBeLessThanOrEqual(1);
  });

  it('카테고리를 상위 상품에서 자동 산출한다', async () => {
    const body = await (await callGET('대저토마토')).json();
    expect(body.category).toBe('식품 > 농산물 > 과일 > 토마토');
  });

  it('기회 키워드는 최대 3개', async () => {
    const body = await (await callGET('대저토마토')).json();
    expect(body.oppKeywords.length).toBeLessThanOrEqual(3);
  });

  it('키워드는 최대 12개로 제한된다', async () => {
    const body = await (await callGET('대저토마토')).json();
    expect(body.keywords.length).toBeLessThanOrEqual(12);
  });
});
