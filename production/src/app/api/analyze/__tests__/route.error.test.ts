import { GET } from '../route';
import { NextRequest } from 'next/server';
import { server } from '@/test/mswServer';
import { http, HttpResponse } from 'msw';

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

describe('GET /api/analyze — 예외 경로', () => {
  it('kw 파라미터가 없으면 400을 반환한다', async () => {
    const res = await callGET();
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('키워드');
  });

  it('검색광고 API가 500이면 500으로 응답한다', async () => {
    server.use(http.get('https://api.searchad.naver.com/keywordstool',
      () => new HttpResponse(null, { status: 500 })));
    expect((await callGET('대저토마토')).status).toBe(500);
  });

  it('쇼핑 API가 401이면 500으로 감싼다', async () => {
    server.use(http.get('https://openapi.naver.com/v1/search/shop.json',
      () => new HttpResponse(null, { status: 401 })));
    expect((await callGET('대저토마토')).status).toBe(500);
  });

  it('네트워크 에러도 크래시 없이 500을 반환한다', async () => {
    server.use(http.get('https://api.searchad.naver.com/keywordstool',
      () => HttpResponse.error()));
    expect((await callGET('대저토마토')).status).toBe(500);
  });

  it('쇼핑 결과가 비어도 크래시하지 않는다', async () => {
    server.use(http.get('https://openapi.naver.com/v1/search/shop.json',
      () => HttpResponse.json({ items: [] })));
    const res = await callGET('희귀키워드');
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      const body = await res.json();
      expect(Number.isNaN(body.competition.bundleRatio)).toBe(false);
    }
  });
});
