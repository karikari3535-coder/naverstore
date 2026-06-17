import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ background: '#FDF6F0', minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>셀러랩스 상품명 추천기</h1>
        <Link href="/naver/smartstore/product-name-recommender"
          style={{ color: '#FF6B4A', fontWeight: 700, fontSize: 18 }}>
          → 상품명 추천기로 이동
        </Link>
      </div>
    </main>
  );
}
