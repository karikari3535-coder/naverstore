/**
 * 스마트스토어 자가진단 — 진단 항목 정의 (criteria)
 *
 * ▣ 구조: 네이버 쇼핑검색 랭킹 공식 3대 축을 그대로 반영
 *    랭킹 = 적합도 × 인기도 × 신뢰도
 *      - 적합도(relevance): 검색 의도 적합 — 상품명/카테고리/제조사·브랜드/속성·태그
 *      - 인기도(popularity): 많이 찾고 팔리는 — 클릭·찜수/판매실적/리뷰수/최신성
 *      - 신뢰도(reliability): 신뢰할 수 있는 정보 — 상품명 SEO/네이버쇼핑 페널티
 *
 * ▣ 평가 방식
 *    - source: 'auto'  → 공개 페이지 자동 수집 데이터로 채점(차단 시 직접 입력)
 *    - source: 'check' → 관리자(센터)에서 확인 후 체크리스트로 응답
 *    - source: 'hybrid'→ 자동값 기본 + 사용자 보정
 *
 * ▣ 점수: 영역(group)별 합산 후, 축(axis)별로 묶어 표시. 총 100점.
 */

export type CriteriaSource = 'auto' | 'check' | 'hybrid'
export type AxisKey = 'relevance' | 'popularity' | 'reliability'

export interface CriteriaItem {
  key: string
  title: string
  desc: string
  max: number
  source: CriteriaSource
  options?: { value: number; label: string }[]
  guide: string
}

export interface CriteriaGroup {
  key: string
  title: string
  icon: string
  /** 소속 랭킹 축 */
  axis: AxisKey
  items: CriteriaItem[]
}

/** 축(상위 카테고리) 메타 — 리포트 상단 3카드 표시용 */
export interface AxisMeta {
  key: AxisKey
  title: string
  subtitle: string
  color: string // 카드 배경색
  icon: string
}

export const AXES: AxisMeta[] = [
  {
    key: 'relevance',
    title: '적합도',
    subtitle: '사용자의 검색 의도에 적합한 상품',
    color: '#4a90d9',
    icon: 'fa-bullseye',
  },
  {
    key: 'popularity',
    title: '인기도',
    subtitle: '많이 찾고 많이 판매되는 상품',
    color: '#e0a82e',
    icon: 'fa-fire',
  },
  {
    key: 'reliability',
    title: '신뢰도',
    subtitle: '상품 정보가 신뢰할 수 있는 상품',
    color: '#52b14e',
    icon: 'fa-shield-halved',
  },
]

/* ================================================================== */
/* 진단 항목 — 3대 축 구조 (100점)                                     */
/* ================================================================== */

export const CRITERIA: CriteriaGroup[] = [
  /* ============ 1. 적합도 (relevance) — 40점 ============ */
  {
    key: 'name',
    title: '상품명',
    icon: 'fa-tag',
    axis: 'relevance',
    items: [
      {
        key: 'name_length',
        title: '상품명 길이 최적화',
        desc: '상품명은 공백 포함 25~50자가 가장 효율적이에요. 너무 짧으면 키워드 노출 기회를 잃고, 너무 길면 키워드 분산으로 적합도가 떨어져요.',
        max: 5,
        source: 'auto',
        guide: '상품명을 25~50자 사이로 조정하고, 핵심 키워드를 앞쪽에 배치하세요.',
      },
      {
        key: 'name_keyword',
        title: '대표 키워드 배치',
        desc: '검색량이 많은 대표 키워드가 상품명 앞쪽에 있을수록 검색 적합도가 올라가요.',
        max: 6,
        source: 'check',
        options: [
          { value: 1, label: '대표 키워드가 상품명 앞쪽에 있다' },
          { value: 0.5, label: '키워드는 있으나 뒤쪽에 있다' },
          { value: 0, label: '핵심 키워드가 없다' },
        ],
        guide: '검색량이 많은 대표 키워드를 상품명 맨 앞에 배치하세요.',
      },
    ],
  },
  {
    key: 'category',
    title: '카테고리',
    icon: 'fa-sitemap',
    axis: 'relevance',
    items: [
      {
        key: 'cat_match',
        title: '카테고리 정확도',
        desc: '상품과 카테고리가 정확히 일치할수록 검색 적합도가 크게 올라가요. 카테고리 오설정은 노출 손해의 가장 큰 원인이에요.',
        max: 7,
        source: 'check',
        options: [
          { value: 1, label: '상품과 정확히 일치한다' },
          { value: 0.5, label: '비슷하지만 애매한 부분이 있다' },
          { value: 0, label: '잘 맞지 않는다' },
        ],
        guide: '핵심 키워드로 카테고리를 검색해 가장 정확한 카테고리를 선택하세요.',
      },
      {
        key: 'cat_depth',
        title: '하위(세부) 카테고리 선택',
        desc: '상위 카테고리보다 세부 하위 카테고리를 선택할수록 노출 적합도가 올라가요.',
        max: 4,
        source: 'check',
        options: [
          { value: 1, label: '가장 세부 카테고리까지 선택했다' },
          { value: 0.5, label: '중간 단계까지만 선택했다' },
          { value: 0, label: '상위 카테고리만 선택했다' },
        ],
        guide: '선택 가능한 가장 깊은 하위 카테고리까지 지정하세요.',
      },
    ],
  },
  {
    key: 'brand',
    title: '제조사·브랜드',
    icon: 'fa-copyright',
    axis: 'relevance',
    items: [
      {
        key: 'brand_maker',
        title: '브랜드·제조사 입력',
        desc: '브랜드/제조사를 입력해야 신뢰도와 검색 적합도가 올라가요. 브랜드가 없으면 스토어명으로 통일해요.',
        max: 4,
        source: 'check',
        options: [
          { value: 1, label: '브랜드·제조사를 모두 입력했다' },
          { value: 0.5, label: '하나만 입력했다' },
          { value: 0, label: '입력하지 않았다' },
        ],
        guide: '브랜드와 제조사를 입력하세요. 브랜드가 없으면 스토어명으로 통일합니다.',
      },
      {
        key: 'model_unique',
        title: '모델명 고유성',
        desc: '모델명은 "스토어명 + 대표 키워드" 조합으로 타 판매자와 겹치지 않게 고유 설정해요.',
        max: 3,
        source: 'check',
        options: [
          { value: 1, label: '고유한 모델명을 설정했다' },
          { value: 0.5, label: '일반적인 모델명을 사용했다' },
          { value: 0, label: '모델명을 입력하지 않았다' },
        ],
        guide: '스토어명과 대표 키워드를 조합해 고유한 모델명을 입력하세요.',
      },
    ],
  },
  {
    key: 'attr',
    title: '속성·태그',
    icon: 'fa-hashtag',
    axis: 'relevance',
    items: [
      {
        key: 'attr_fill',
        title: '상품속성 채움',
        desc: '카테고리에서 제공하는 상품속성을 많이 채울수록 필터 검색 노출과 적합도가 올라가요.',
        max: 7,
        source: 'check',
        options: [
          { value: 1, label: '제공된 속성을 모두(80%+) 입력했다' },
          { value: 0.5, label: '절반 정도 입력했다' },
          { value: 0, label: '거의 입력하지 않았다' },
        ],
        guide: '카테고리에서 제공하는 모든 상품속성을 최대한 채우세요.',
      },
      {
        key: 'tag_count',
        title: '태그 10개 채움',
        desc: '태그는 검색 노출에 직접 영향을 줘요. 최대 10개까지 채우는 게 유리해요.',
        max: 4,
        source: 'check',
        options: [
          { value: 1, label: '10개를 모두 채웠다' },
          { value: 0.5, label: '5~9개 채웠다' },
          { value: 0, label: '4개 이하이다' },
        ],
        guide: '태그를 10개까지 모두 채우세요. 메인·세부·연관 키워드를 균형있게 배치하세요.',
      },
    ],
  },

  /* ============ 2. 인기도 (popularity) — 38점 ============ */
  {
    key: 'click',
    title: '클릭수·찜수',
    icon: 'fa-hand-pointer',
    axis: 'popularity',
    items: [
      {
        key: 'ctr_thumb',
        title: '대표 이미지 클릭 유도력',
        desc: '검색 결과에서의 클릭률은 인기도에 직접 영향을 줘요. 대표 이미지가 눈에 띄고 깔끔할수록 클릭이 늘어요.',
        max: 6,
        source: 'check',
        options: [
          { value: 1, label: '경쟁 상품보다 눈에 띄는 누끼/연출컷이다' },
          { value: 0.5, label: '평범한 수준이다' },
          { value: 0, label: '클릭을 유도하기 어렵다' },
        ],
        guide: '대표 이미지를 흰 배경 누끼 또는 강렬한 연출컷으로 교체해 클릭률을 높이세요.',
      },
      {
        key: 'wish_count',
        title: '찜(관심고객) 수',
        desc: '찜 수가 많을수록 인기도 신호가 강해져요. 단골/관심고객 확보가 중요해요.',
        max: 5,
        source: 'check',
        options: [
          { value: 1, label: '꾸준히 찜이 쌓이고 있다' },
          { value: 0.5, label: '약간 있다' },
          { value: 0, label: '거의 없다' },
        ],
        guide: '스토어찜/소식알림 이벤트, 쿠폰으로 찜·관심고객을 유도하세요.',
      },
    ],
  },
  {
    key: 'sales',
    title: '판매실적',
    icon: 'fa-won-sign',
    axis: 'popularity',
    items: [
      {
        key: 'sales_volume',
        title: '판매 실적(누적/최근)',
        desc: '판매량은 인기도의 핵심 지표예요. 최근 판매가 꾸준할수록 노출이 올라가요.',
        max: 6,
        source: 'check',
        options: [
          { value: 1, label: '꾸준한 판매가 발생하고 있다' },
          { value: 0.5, label: '간헐적으로 판매된다' },
          { value: 0, label: '판매가 거의 없다' },
        ],
        guide: '초기엔 광고/이벤트로 판매 흐름을 만들고, 전환율(상세·가격·리뷰)을 개선하세요.',
      },
    ],
  },
  {
    key: 'review',
    title: '리뷰수',
    icon: 'fa-star',
    axis: 'popularity',
    items: [
      {
        key: 'review_count',
        title: '리뷰 수',
        desc: '리뷰 수는 인기도·전환율에 큰 영향을 줘요. 초기 리뷰를 빠르게 쌓는 게 중요해요.',
        max: 6,
        source: 'auto',
        guide: '리뷰 이벤트/포인트로 초기 리뷰를 빠르게 확보하세요.',
      },
      {
        key: 'review_rating',
        title: '평균 별점',
        desc: '평균 별점이 높을수록 노출과 전환에 유리해요.',
        max: 4,
        source: 'auto',
        guide: '낮은 별점 리뷰의 원인(배송/품질/CS)을 개선하세요.',
      },
      {
        key: 'review_point',
        title: '리뷰 포인트 설정',
        desc: '구매 후 리뷰 작성 시 지급하는 포인트로 리뷰를 유도해요. 포토 리뷰를 텍스트보다 높게 설정하면 양질 리뷰가 쌓여요.',
        max: 3,
        source: 'check',
        options: [
          { value: 1, label: '포토 리뷰 포인트를 더 높게 설정했다' },
          { value: 0.5, label: '리뷰 포인트는 있으나 동일하다' },
          { value: 0, label: '리뷰 포인트가 없다' },
        ],
        guide: '텍스트/포토 리뷰 포인트를 설정하고, 포토 리뷰를 우대하세요.',
      },
    ],
  },
  {
    key: 'fresh',
    title: '최신성',
    icon: 'fa-clock-rotate-left',
    axis: 'popularity',
    items: [
      {
        key: 'fresh_register',
        title: '신상품 가점(등록 최신성)',
        desc: '네이버는 신규 등록 상품에 일정 기간 노출 가점을 줘요. 등록 직후 흐름을 잘 만드는 게 중요해요.',
        max: 5,
        source: 'check',
        options: [
          { value: 1, label: '최근 등록(또는 리뉴얼)했다' },
          { value: 0.5, label: '등록한 지 다소 지났다' },
          { value: 0, label: '오래 전 등록 후 변화가 없다' },
        ],
        guide: '경쟁이 치열하면 상품을 리뉴얼 재등록하거나, 신상품 가점 기간에 마케팅을 집중하세요.',
      },
      {
        key: 'fresh_update',
        title: '정보 최신 관리',
        desc: '상세/이미지/가격/재고를 주기적으로 갱신하면 활성 상품으로 인식돼요.',
        max: 3,
        source: 'check',
        options: [
          { value: 1, label: '주기적으로 업데이트한다' },
          { value: 0.5, label: '가끔 업데이트한다' },
          { value: 0, label: '방치되어 있다' },
        ],
        guide: '시즌/트렌드에 맞춰 상세·이미지·가격을 주기적으로 갱신하세요.',
      },
    ],
  },

  /* ============ 3. 신뢰도 (reliability) — 22점 ============ */
  {
    key: 'seo',
    title: '상품명 SEO',
    icon: 'fa-magnifying-glass',
    axis: 'reliability',
    items: [
      {
        key: 'seo_clean',
        title: '상품명 SEO 규칙 준수',
        desc: '키워드 반복·특수문자·관련 없는 키워드·과장 문구는 신뢰도 페널티 요인이에요. 권장: 브랜드+상품명+핵심속성.',
        max: 6,
        source: 'hybrid',
        options: [
          { value: 1, label: '중복/특수문자/과장 없이 깔끔하다' },
          { value: 0.5, label: '일부 중복·특수문자가 있다' },
          { value: 0, label: '키워드 반복·특수문자가 많다' },
        ],
        guide: '동일 키워드 반복과 불필요한 특수문자(★, ♥ 등), 과장 문구를 제거하세요.',
      },
      {
        key: 'img_quality',
        title: '이미지 품질·구성',
        desc: '추가 이미지(최대 10장)·고해상도(1500px+)·다양한 구성은 정보 신뢰도를 높여요.',
        max: 6,
        source: 'auto',
        guide: '추가 이미지를 최대 10장까지 채우고, 1500px 이상 고해상도로 다양한 각도를 구성하세요.',
      },
      {
        key: 'product_notice',
        title: '상품정보제공고시',
        desc: '법적 필수 항목이에요. 안 채우면 판매 제한·신뢰도 하락이 발생할 수 있어요.',
        max: 4,
        source: 'check',
        options: [
          { value: 1, label: '필수 항목을 직접 모두 입력했다' },
          { value: 0.5, label: '"상품상세 참조"로 채웠다' },
          { value: 0, label: '입력하지 않았다' },
        ],
        guide: '상품정보제공고시 법적 필수 항목을 직접 입력하세요.',
      },
    ],
  },
  {
    key: 'penalty',
    title: '네이버쇼핑 페널티',
    icon: 'fa-triangle-exclamation',
    axis: 'reliability',
    items: [
      {
        key: 'penalty_abuse',
        title: '어뷰징/페널티 요인 없음',
        desc: '키워드 어뷰징, 카테고리 오설정, 가격/혜택 허위, 반복 신고는 노출 페널티로 이어져요.',
        max: 3,
        source: 'check',
        options: [
          { value: 1, label: '어뷰징/페널티 요인이 전혀 없다' },
          { value: 0.5, label: '확실치 않은 부분이 있다' },
          { value: 0, label: '페널티 요인이 있다' },
        ],
        guide: '관련 없는 인기 키워드 태그·잘못된 카테고리·허위 혜택을 제거하세요.',
      },
      {
        key: 'penalty_ops',
        title: '운영 신뢰도(배송·CS)',
        desc: '출고 지연, 품절 방치, 클레임 누적은 판매자 지수를 떨어뜨려요. 배송비/도서산간/출고일을 정확히 관리하세요.',
        max: 3,
        source: 'check',
        options: [
          { value: 1, label: '배송·출고일·CS를 잘 관리하고 있다' },
          { value: 0.5, label: '가끔 지연·문제가 있다' },
          { value: 0, label: '지연/클레임이 잦다' },
        ],
        guide: '출고 예정일을 현실적으로 설정하고, 배송비·제주/도서산간을 정확히 입력하세요.',
      },
    ],
  },
]

/** 전체 만점 합계 (검증용) */
export const TOTAL_MAX = CRITERIA.reduce(
  (sum, g) => sum + g.items.reduce((s, it) => s + it.max, 0),
  0
)

/** 축별 만점 합계 */
export function axisMax(axis: AxisKey): number {
  return CRITERIA.filter((g) => g.axis === axis).reduce(
    (sum, g) => sum + g.items.reduce((s, it) => s + it.max, 0),
    0
  )
}
