import { Metadata } from 'next';
import ProductRecommender from '@/components/product-recommender/ProductRecommender';

export const metadata: Metadata = {
  title: '셀러랩스 | 상품명 추천기 — 키워드 하나로 상위노출 상품명',
  description: '네이버 쇼핑 상위 40개를 실시간 분석해 검색에 최적화된 상품명을 자동 생성합니다.',
};

export default function Page() {
  return (
    <main style={{ background: '#FDF6F0', minHeight: '100vh', padding: '80px 24px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ color: '#FF6B4A', fontWeight: 700, marginBottom: 14 }}>⚡ 셀러랩스 상품명 추천기</p>
        <h1 style={{ fontSize: 'clamp(30px,5vw,50px)', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.28 }}>
          키워드만 넣으면 상위노출 상품명이 3초면 끝
        </h1>
        <p style={{ color: '#8A817A', fontSize: 18, margin: '22px auto 40px', maxWidth: 600 }}>
          네이버 쇼핑 상위 40개를 실시간 분석해, 검색에 가장 잘 걸리는 상품명을 자동으로 만들어 드려요.
        </p>
        <ProductRecommender />
      </div>
    </main>
  );
}
