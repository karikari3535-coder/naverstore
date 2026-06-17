import { GET } from '../route';
import { NextRequest } from 'next/server';
import * as naver from '@/lib/recommender/naverSearchAd';

jest.mock('@/lib/recommender/naverSearchAd');
const mockNaver = naver as jest.Mocked<typeof naver>;

describe('GET /api/analyze — spyOn 모킹', () => {
  beforeEach(() => {
    mockNaver.getTopProducts.mockResolvedValue([
      { title: '부산 대저토마토 짭짤이 완숙 방울토마토 5kg',
        category1: '식품', category2: '농산물', category3: '과일', category4: '토마토' },
      { title: '부산 대저토마토 고당도 제철 방울토마토',
        category1: '식품', category2: '농산물', category3: '과일', category4: '토마토' },
    ]);
    mockNaver.getKeywordVolumes.mockResolvedValue([
      { word: '부산', volume: 14800, compIdx: '높음' },
      { word: '방울토마토', volume: 18100, compIdx: '높음' },
      { word: '제철', volume: 9900, compIdx: '낮음' },
    ]);
    // 순수 함수는 실제 구현을 그대로 사용
    const actual = jest.requireActual('@/lib/recommender/naverSearchAd');
    mockNaver.extractFrequency.mockImplementation(actual.extractFrequency);
    mockNaver.extractCategory.mockImplementation(actual.extractCategory);
  });

  afterEach(() => jest.clearAllMocks());

  it('두 API를 병렬 호출하고 결과를 병합한다', async () => {
    const res = await GET(new NextRequest('http://localhost/api/analyze?kw=대저토마토'));
    expect(res.status).toBe(200);
    expect(mockNaver.getTopProducts).toHaveBeenCalledWith('대저토마토');
    expect(mockNaver.getKeywordVolumes).toHaveBeenCalledWith('대저토마토');
    expect((await res.json()).keywords.length).toBeGreaterThan(0);
  });

  it('카테고리를 최빈값으로 산출한다', async () => {
    const res = await GET(new NextRequest('http://localhost/api/analyze?kw=대저토마토'));
    expect((await res.json()).category).toBe('식품 > 농산물 > 과일 > 토마토');
  });

  it('검색광고 API가 reject되면 500을 반환한다', async () => {
    mockNaver.getKeywordVolumes.mockRejectedValue(new Error('rate limit'));
    const res = await GET(new NextRequest('http://localhost/api/analyze?kw=대저토마토'));
    expect(res.status).toBe(500);
    expect((await res.json()).detail).toBe('rate limit');
  });
});
