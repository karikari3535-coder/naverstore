import { KeywordStat, Competition } from '@/types/recommender';

export const TOMATO_KEYWORDS: KeywordStat[] = [
  { word: '부산', freq: 12, volume: 14800 },
  { word: '방울토마토', freq: 5, volume: 18100 },
  { word: '고당도', freq: 6, volume: 8100 },
  { word: '제철', freq: 4, volume: 9900 },
  { word: '짭짤이', freq: 11, volume: 3200 },
  { word: '완숙', freq: 8, volume: 2900 },
  { word: '대추', freq: 5, volume: 5400 },
  { word: '찰', freq: 5, volume: 1600 },
];

export const EASY_COMPETITION: Competition = {
  bundleRatio: 0, avgReview: 1.2, totalProducts: 40, searchVolume: 4680,
};
export const HARD_COMPETITION: Competition = {
  bundleRatio: 0.8, avgReview: 480, totalProducts: 40, searchVolume: 1200,
};
export const MEDIUM_COMPETITION: Competition = {
  bundleRatio: 0.3, avgReview: 30, totalProducts: 40, searchVolume: 6000,
};

// ─────────────────────────────────────────────
// [추가] 필터링 / 길이분포 검증용 fixtures
// ─────────────────────────────────────────────

import { KeywordStat as _KW } from '@/types/recommender';

/** 숫자·중량·수식어가 섞인 "오염된" 키워드 묶음 */
export const DIRTY_KEYWORDS: _KW[] = [
  { word: '섬국', freq: 14, volume: 4570 },
  { word: '자연산', freq: 14, volume: 200 },
  { word: '5kg', freq: 9, volume: 1200 },      // 제외 대상(중량)
  { word: '4-5미', freq: 7, volume: 300 },     // 제외 대상(수량 범위)
  { word: '특가', freq: 6, volume: 800 },      // 제외 대상(수식어)
  { word: '홍합탕', freq: 9, volume: 2610 },
  { word: '10개입', freq: 5, volume: 150 },    // 제외 대상(수량)
  { word: '/', freq: 4, volume: 0 },           // 제외 대상(특수문자)
  { word: '동', freq: 3, volume: 100 },        // 제외 대상(1글자)
  { word: '통영', freq: 5, volume: 61200 },
];

/** 상위 40개 상품명을 가정한 제목 배열 (단어수 분포 검증용) */
export const SAMPLE_TITLES: string[] = [
  '섬국 자연산 해장국 홍합탕 통영 밀키트',           // 6단어
  '섬국 자연산 해장국 홍합탕 통영 밀키트 다듬이',    // 7단어
  '섬국 자연산 해장국 홍합탕 통영 밀키트 캠핑',      // 7단어
  '섬국 자연산 해장국 홍합탕 통영',                  // 5단어
  '섬국 자연산 해장국 홍합탕 통영 밀키트 캠핑 동해', // 8단어
];
