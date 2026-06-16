import { PAGE_CSS } from './styles'
import { CLIENT_JS } from './client'
import { CRITERIA } from './lib/criteria'

/**
 * 메인 페이지 HTML (3단계 SPA)
 *   Stage 1: URL 입력 / 진단 시작
 *   Stage 2: 자동수집 결과 확인 + 체크리스트 응답
 *   Stage 3: 진단 리포트 (점수/등급/영역별/개선 우선순위)
 */
export function renderHome(): string {
  // 체크리스트 정의를 클라이언트로 전달(인라인 JSON)
  const criteriaJson = JSON.stringify(CRITERIA)

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>스마트스토어 자가진단 | SmartStore Self-Diagnosis</title>
  <meta name="description" content="네이버 스마트스토어 상품 최적화 자가진단 — 쇼핑검색 랭킹 3대 축(적합도·인기도·신뢰도) 21개 항목을 진단하고 100점 만점 점수와 개선 가이드를 제공합니다." />
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%2303c75a'/%3E%3Ctext x='50' y='70' font-size='60' text-anchor='middle' fill='white' font-family='sans-serif' font-weight='bold'%3ES%3C/text%3E%3C/svg%3E" />
  <link rel="preconnect" href="https://cdn.jsdelivr.net" />
  <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" rel="stylesheet" />
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
  <style>${PAGE_CSS}</style>
</head>
<body>
  <div id="app">
    <!-- ===== 헤더 ===== -->
    <header class="site-header">
      <div class="wrap header-inner">
        <div class="logo">
          <i class="fas fa-store"></i>
          <span>스마트스토어 자가진단</span>
        </div>
        <div class="header-sub">상품 최적화 점검 · 100점 진단</div>
      </div>
    </header>

    <main class="wrap">
      <!-- ===== STAGE 1: 입력 ===== -->
      <section id="stage1" class="stage stage-active">
        <div class="hero">
          <h1 class="hero-title">내 스마트스토어 상품,<br/><b>검색 노출 최적화</b>가 됐을까?</h1>
          <p class="hero-desc">
            상품 URL을 넣으면 공개 정보를 자동으로 가져오고,<br class="br-pc"/>
            관리자에서만 보이는 항목은 간단한 체크로 보완해 <b>100점 만점</b> 진단해드려요.
          </p>

          <div class="input-card">
            <label class="input-label" for="urlInput">
              <i class="fas fa-link"></i> 스마트스토어 상품 URL
            </label>
            <div class="input-row">
              <input id="urlInput" type="text" inputmode="url"
                placeholder="예) https://smartstore.naver.com/스토어명/products/1234567890" />
              <button id="startBtn" class="btn btn-primary">
                <i class="fas fa-magnifying-glass-chart"></i> 진단 시작
              </button>
            </div>
            <button id="skipUrlBtn" class="link-btn">
              URL 없이 체크리스트만으로 진단하기 →
            </button>
            <p id="inputError" class="input-error" hidden></p>
          </div>

          <ul class="feature-list">
            <li><i class="fas fa-bolt"></i> 공개 정보 자동 수집(상품명·이미지·리뷰·별점)</li>
            <li><i class="fas fa-ranking-star"></i> 쇼핑검색 랭킹 3대 축 — 적합도 × 인기도 × 신뢰도</li>
            <li><i class="fas fa-list-check"></i> 21개 항목 정밀 진단 + 개선 우선순위 제공</li>
          </ul>

          <p class="disclaimer">
            <i class="fas fa-circle-info"></i>
            본 진단은 네이버 공식 점수가 아니라, 공개 자료 기반의 최적화 가이드입니다.
          </p>
        </div>
      </section>

      <!-- ===== STAGE 2: 자동수집 + 체크리스트 ===== -->
      <section id="stage2" class="stage">
        <div id="loadingBox" class="loading-box">
          <div class="spinner"></div>
          <p id="loadingText">상품 정보를 가져오는 중이에요…</p>
        </div>

        <div id="checklistBox" hidden>
          <!-- 자동수집 요약 카드 -->
          <div id="autoCard" class="auto-card"></div>

          <div class="checklist-head">
            <h2><i class="fas fa-list-check"></i> 체크리스트</h2>
            <p>관리자(센터)에서 확인 후 해당하는 항목을 선택하세요. 자동으로 채워진 항목은 그대로 두셔도 됩니다.</p>
          </div>

          <form id="checklistForm"></form>

          <div class="checklist-actions">
            <button id="backBtn" class="btn btn-ghost"><i class="fas fa-arrow-left"></i> 이전</button>
            <button id="diagnoseBtn" class="btn btn-primary"><i class="fas fa-chart-pie"></i> 결과 보기</button>
          </div>
        </div>
      </section>

      <!-- ===== STAGE 3: 리포트 ===== -->
      <section id="stage3" class="stage">
        <div id="reportBox"></div>
        <div class="report-actions">
          <button id="restartBtn" class="btn btn-ghost"><i class="fas fa-rotate-left"></i> 다시 진단</button>
          <button id="printBtn" class="btn btn-secondary"><i class="fas fa-download"></i> PDF로 저장</button>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="wrap">
        <p>스마트스토어 자가진단 · 참고: 네이버 스마트스토어 최적화 가이드</p>
        <p class="footer-sub">상품 데이터는 저장하지 않으며, 진단 즉시 처리 후 폐기됩니다.</p>
      </div>
    </footer>
  </div>

  <script>window.__CRITERIA__ = ${criteriaJson};</script>
  <script>${CLIENT_JS}</script>
</body>
</html>`
}
