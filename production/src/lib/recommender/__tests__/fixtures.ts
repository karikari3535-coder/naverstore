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
