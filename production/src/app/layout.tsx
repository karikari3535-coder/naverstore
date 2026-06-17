import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '셀러랩스 상품명 추천기',
  description: '네이버 쇼핑 상위 40개를 분석해 상위노출 상품명을 자동 생성합니다.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
