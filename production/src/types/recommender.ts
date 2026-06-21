export interface KeywordStat {
  word: string;
  freq: number;
  volume: number;
  score?: number;
}

export interface Competition {
  bundleRatio: number;
  avgReview: number;
  totalProducts: number;
  searchVolume: number;
}

export interface AnalyzeResult {
  keyword: string;
  category: string;
  keywords: KeywordStat[];
  competition: Competition;
  extraTags: string[];
  oppKeywords: string[];
  productName?: string;
  reasons?: string[];
  lengthDist?: {
    buckets: { words: number; count: number; isHot: boolean }[];
    avgWords: number;
    recommendRange: [number, number];
  };
  excludedKeywords?: {
    numeric: string[];
    promo: string[];
  };
}

export type RecommendMode = 'quick' | 'complete' | 'competition';
