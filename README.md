# 셀러랩스 상품명 추천기 (Product Name Recommender)

네이버 쇼핑 상위 40개를 분석해, 검색에 최적화된 상품명을
자동 생성하는 도구입니다. 키워드 입력 → 상품명 추천 →
진입난이도 분석 → 순위추적 등록까지 한 흐름으로 동작합니다.

> ⚠️ 현재 셀러랩스 서버와는 연동되지 않은 **독립 프로토타입**입니다.
> 실제 연동 지점은 코드 내 `// TODO` 주석으로 표시돼 있습니다.

---

## 📦 구성

이 프로젝트는 두 가지 형태로 제공됩니다.

| | 용도 | 위치 | 실행 |
|---|---|---|---|
| **데모** | 시연·체험용 단일 파일 | `demo.html` | 더블클릭 |
| **제품** | 실제 배포용 Next.js | `production/` | `npm run dev` |

- `demo.html` — 설치 없이 브라우저에서 바로 실행됩니다.
  더미 데이터(`DEMO_DB`)로 모든 UI·로직을 체험할 수 있습니다.
- `production/` — 셀러랩스 컨벤션(App Router + CSS Modules)에
  맞춘 실제 제품 코드입니다. 네이버 API 연동·테스트를 포함합니다.

---

## 🚀 빠른 시작

### 1) 데모만 보고 싶다면
```
demo.html 파일을 더블클릭 → 브라우저에서 바로 작동
```
별도 설치가 필요 없습니다. "대저토마토", "신안새우" 두 키워드가 샘플로 준비돼 있습니다.

### 2) 제품 코드를 실행하려면
```bash
cd production
npm install
cp .env.local.example .env.local   # 네이버 API 키 입력
npm run dev                          # http://localhost:3000
```

### 3) 네이버 API 연결만 먼저 확인하려면
```bash
cd production
npm run test:naver   # 검색광고/쇼핑 API 키가 살아있는지 단독 확인
```

---

## 🔑 환경변수 (네이버 API)

`production/.env.local`에 아래 값을 채웁니다.
키 발급은 셀러랩스가 아닌 본인(회사) 명의로 받습니다.

```bash
# (A) 네이버 검색광고 API (검색량) — searchad.naver.com
NAVER_API_KEY=
NAVER_SECRET_KEY=
NAVER_CUSTOMER_ID=

# (B) 네이버 쇼핑 검색 API (상위 40개) — developers.naver.com
#     ※ 사이트 URL 이 있어야 발급 가능 → 배포 후 도메인 나오면 채우기
NAVER_SHOP_ID=
NAVER_SHOP_SECRET=
```

| 키 | 발급처 | 비고 |
|---|---|---|
| `NAVER_API_KEY` / `NAVER_SECRET_KEY` / `NAVER_CUSTOMER_ID` | searchad.naver.com → 도구 → API 사용 관리 | 즉시 발급, HMAC 서명용 |
| `NAVER_SHOP_ID` / `NAVER_SHOP_SECRET` | developers.naver.com → 앱 등록 (사용 API "검색" 체크) | **사이트 URL 필요** · 하루 25,000회 |

---

## 🧩 핵심 흐름

```
키워드 입력
  → [engine.ts] 빈도60% + 검색량40% 점수화
  → 상품명 조립 (7단어/50자 이내, 중복·포함관계 제거)
  → [route.ts] 네이버 API로 실제 검색량·카테고리 분석
  → 진입난이도 게이지 + 현재vs추천 비교 표시
  → [trackingStore.ts] 순위추적 등록 (현재 localStorage)
  → 내 추적 목록에서 확인
```

---

## 📂 주요 파일 안내

### 로직 (순수 함수 — 테스트 가능)
| 파일 | 역할 |
|---|---|
| `production/src/lib/recommender/engine.ts` | 점수화·상품명 조립·난이도 계산 |
| `production/src/lib/recommender/naverSearchAd.ts` | 네이버 API 클라이언트 + 카테고리/빈도 추출 |
| `production/src/lib/recommender/trackingStore.ts` | 추적 저장소 (목업) |

### UI 컴포넌트
| 파일 | 역할 |
|---|---|
| `ProductRecommender.tsx` | 메인 컨테이너 (상태 관리) |
| `ModeTabs.tsx` | 빠른/완벽/경쟁률 모드 전환 |
| `ResultCard.tsx` | 결과 카드 조립 |
| `DifficultyGauge.tsx` | 진입난이도 게이지 |
| `VersusCompare.tsx` | 현재 vs 추천 비교 |
| `TrackButton.tsx` | 순위추적 등록 버튼 |
| `TrackedList.tsx` | 내 추적 목록 |

### API (서버)
| 파일 | 역할 |
|---|---|
| `production/src/app/api/analyze/route.ts` | `/api/analyze?kw=` 핸들러 |

---

## 🧪 테스트

```bash
cd production
npm test            # 전체 실행
npm run test:cov    # 커버리지 포함
npm run test:watch  # 워치 모드
```

| 테스트 | 대상 |
|---|---|
| `scoreKeywords.test.ts` | 점수화·정렬·불변성 |
| `buildProductName.test.ts` | 상품명 조립 (골든 테스트 포함) |
| `difficulty.test.ts` | 난이도 계산·판정 경계값 |
| `trackingStore.test.ts` | 로컬 등록·삭제 |
| `route.test.ts` | API 정상 경로 (MSW) |
| `route.error.test.ts` | API 예외 경로 (MSW) |
| `route.spy.test.ts` | spyOn 방식 대안 |

> 골든 테스트의 기대 문자열은 실제 출력으로 한 번 맞춰 고정되어 있습니다.

---

## 🔌 실제 연동 시 교체 지점 (3곳)

현재는 독립 동작합니다. 실서비스 전환 시 아래만 바꿉니다.

1. **검색 데이터** — `demo.html`의 `DEMO_DB` → `route.ts`의 네이버 API 호출로 (제품 코드엔 이미 구현됨)
2. **순위추적 등록** — `trackingStore.ts`의 `registerTracking` 내부 `// TODO` 자리를 셀러랩스 API `fetch`로 교체
3. **카테고리 산출** — `route.ts`에서 `extractCategory()`로 자동 산출됨 (쇼핑 API `category1~4` 활용, 구현 완료)

---

## 🎨 디자인 토큰

셀러랩스 실제 톤 기준 (웜 크림 베이스). `production/src/app/globals.css` 에 정의.

| 토큰 | 값 | 용도 |
|---|---|---|
| `--sl-bg` | `#FDF6F0` | 배경 (웜 크림) |
| `--sl-ink` | `#2A2420` | 본문 (따뜻한 차콜) |
| `--sl-primary` | `#FF6B4A` | CTA·포인트 (코랄) |
| `--sl-green` | `#1FA37A` | 기회 (난이도 낮음) |
| `--sl-yellow` | `#E8A33D` | 보통 |
| `--sl-red` | `#E5604D` | 경쟁 심함 |

> 코랄(`#FF6B4A`)은 헤더 톤 추정값입니다. 실제 로고 SVG의 정확한 HEX로 교체 권장.

---

## 📌 현재 상태 / 다음 단계

- [x] 추천 엔진 + UI 완성
- [x] 진입난이도 게이지 / 현재vs추천 비교
- [x] 순위추적 로컬 등록 (목업)
- [x] 단위·통합 테스트
- [x] 카테고리 자동 산출 (쇼핑 API category 필드)
- [ ] 네이버 쇼핑 API 키 발급 → 실데이터 연결 (사이트 URL 필요)
- [ ] 셀러랩스 순위추적 실연동
- [ ] CI(GitHub Actions) 파이프라인

---

## 📝 라이선스 / 비고

내부 프로토타입. 외부 배포 전 셀러랩스 팀과 API·디자인 토큰·연동 범위를 협의하세요.
