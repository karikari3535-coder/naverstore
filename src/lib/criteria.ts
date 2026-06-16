/**
 * 스마트스토어 자가진단 — 진단 항목 정의 (criteria)
 *
 * 원본 네이버플레이스 프로그램과 동일한 "영역 → 항목 → 배점" 구조.
 * 각 항목은 다음 둘 중 하나의 방식으로 평가된다.
 *   - source: 'auto'  → 공개 상품 페이지에서 자동 수집한 데이터로 채점
 *   - source: 'check' → 사용자가 관리자(센터)에서 확인 후 응답하는 체크리스트
 *   - source: 'hybrid'→ 자동 수집값을 기본으로 두되 사용자가 보정 가능
 *
 * 점수 합계는 100점. 영역(group)별로 묶어 리포트에 표시한다.
 */

export type CriteriaSource = 'auto' | 'check' | 'hybrid'

export interface CriteriaItem {
  /** 항목 고유 키 */
  key: string
  /** 화면 표시 제목 */
  title: string
  /** 항목 설명 / 진단 근거 */
  desc: string
  /** 만점 배점 */
  max: number
  /** 평가 방식 */
  source: CriteriaSource
  /**
   * 체크리스트 응답 선택지 (source가 check/hybrid일 때)
   * value: 0~1 비율(배점에 곱해짐) / label: 표시 문구
   */
  options?: { value: number; label: string }[]
  /** 개선 가이드 (감점 시 노출) */
  guide: string
}

export interface CriteriaGroup {
  key: string
  title: string
  icon: string // FontAwesome 클래스
  items: CriteriaItem[]
}

/* ------------------------------------------------------------------ */
/* 진단 항목 체계 (6개 영역, 100점)                                     */
/* ------------------------------------------------------------------ */

export const CRITERIA: CriteriaGroup[] = [
  {
    key: 'name',
    title: '상품명·키워드',
    icon: 'fa-tag',
    items: [
      {
        key: 'name_length',
        title: '상품명 길이 최적화',
        desc: '상품명은 공백 포함 25~50자가 가장 효율적이에요. 너무 짧으면 키워드 노출 기회를 잃고, 너무 길면 키워드 분산으로 적합도가 떨어져요.',
        max: 6,
        source: 'auto',
        guide: '상품명을 25~50자 사이로 조정하고, 핵심 키워드를 앞쪽에 배치하세요.',
      },
      {
        key: 'name_keyword',
        title: '핵심 키워드 포함',
        desc: '대표 키워드(검색량 높은 키워드)가 상품명 앞쪽에 들어가 있는지 확인해요.',
        max: 6,
        source: 'check',
        options: [
          { value: 1, label: '대표 키워드가 상품명 앞쪽에 있다' },
          { value: 0.5, label: '키워드는 있으나 뒤쪽에 있다' },
          { value: 0, label: '핵심 키워드가 없다' },
        ],
        guide: '검색량이 많은 대표 키워드를 상품명 맨 앞에 배치하세요.',
      },
      {
        key: 'name_no_abuse',
        title: '상품명 어뷰징 없음',
        desc: '특수문자 반복, 키워드 중복 나열, 관련 없는 키워드는 어뷰징으로 불이익을 받아요.',
        max: 5,
        source: 'hybrid',
        options: [
          { value: 1, label: '중복/특수문자/관련없는 키워드가 없다' },
          { value: 0.5, label: '일부 중복이나 특수문자가 있다' },
          { value: 0, label: '키워드 반복·특수문자가 많다' },
        ],
        guide: '동일 키워드 반복과 불필요한 특수문자(★, ♥ 등)를 제거하세요.',
      },
      {
        key: 'model_unique',
        title: '모델명 고유성',
        desc: '모델명은 "스토어명 + 대표 키워드" 조합으로 타 판매자와 겹치지 않게 고유 설정해요.',
        max: 5,
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
    key: 'category',
    title: '카테고리·속성',
    icon: 'fa-sitemap',
    items: [
      {
        key: 'cat_match',
        title: '카테고리 정확도',
        desc: '네이버는 카테고리 기반으로 상품을 분류해요. 상품과 정확히 일치하는 카테고리를 골라야 검색 적합도가 올라가요.',
        max: 6,
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
        max: 5,
        source: 'check',
        options: [
          { value: 1, label: '가장 세부 카테고리까지 선택했다' },
          { value: 0.5, label: '중간 단계까지만 선택했다' },
          { value: 0, label: '상위 카테고리만 선택했다' },
        ],
        guide: '선택 가능한 가장 깊은 하위 카테고리까지 지정하세요.',
      },
      {
        key: 'attr_fill',
        title: '상품속성 입력 (핵심)',
        desc: '소재·색상·사이즈 등 상품 속성은 검색 노출에 직접 영향을 줘요. 비워두면 검색 적합도에서 손해예요.',
        max: 6,
        source: 'check',
        options: [
          { value: 1, label: '제공된 속성을 모두(80%+) 입력했다' },
          { value: 0.5, label: '절반 정도 입력했다' },
          { value: 0, label: '거의 입력하지 않았다' },
        ],
        guide: '카테고리에서 제공하는 모든 상품속성을 최대한 채우세요.',
      },
      {
        key: 'brand_maker',
        title: '브랜드·제조사 입력',
        desc: '브랜드/제조사를 입력해야 신뢰도와 검색 적합도가 올라가요. 브랜드가 없으면 스토어명으로 통일해요.',
        max: 5,
        source: 'check',
        options: [
          { value: 1, label: '브랜드·제조사를 모두 입력했다' },
          { value: 0.5, label: '하나만 입력했다' },
          { value: 0, label: '입력하지 않았다' },
        ],
        guide: '브랜드와 제조사를 입력하세요. 브랜드가 없으면 스토어명으로 통일합니다.',
      },
    ],
  },
  {
    key: 'image',
    title: '이미지',
    icon: 'fa-image',
    items: [
      {
        key: 'img_count',
        title: '추가 이미지 수',
        desc: '추가 이미지는 최대 10장. 이미지가 많을수록 신뢰도와 알고리즘 정보량이 올라가요.',
        max: 6,
        source: 'auto',
        guide: '대표컷 외 추가 이미지를 최대 10장까지 채우세요.',
      },
      {
        key: 'img_thumbnail',
        title: '대표 이미지 누끼 컷',
        desc: '대표 이미지는 배경 없는 깨끗한 누끼 컷이 클릭률에 유리해요.',
        max: 5,
        source: 'check',
        options: [
          { value: 1, label: '깨끗한 누끼 컷이다' },
          { value: 0.5, label: '배경이 일부 있다' },
          { value: 0, label: '복잡한 배경/텍스트가 많다' },
        ],
        guide: '대표 이미지를 흰 배경의 누끼 컷으로 교체하세요.',
      },
      {
        key: 'img_resolution',
        title: '고해상도 (1500px+)',
        desc: '네이버는 선명한 고해상도(1500px 이상) 이미지를 권장해요.',
        max: 5,
        source: 'check',
        options: [
          { value: 1, label: '모든 이미지가 1500px 이상이다' },
          { value: 0.5, label: '일부만 고해상도이다' },
          { value: 0, label: '저해상도 이미지가 많다' },
        ],
        guide: '모든 이미지를 1500px 이상 고해상도로 교체하세요.',
      },
      {
        key: 'img_variety',
        title: '이미지 구성 다양성',
        desc: '다양한 각도, 실사용컷, 디테일컷, 색상별 이미지를 구성하면 전환율이 올라가요.',
        max: 4,
        source: 'check',
        options: [
          { value: 1, label: '각도·실사용·디테일·색상 골고루 있다' },
          { value: 0.5, label: '일부 구성만 있다' },
          { value: 0, label: '비슷한 이미지만 있다' },
        ],
        guide: '다양한 각도/실사용/디테일/색상별 이미지를 추가하세요.',
      },
    ],
  },
  {
    key: 'tag',
    title: '태그',
    icon: 'fa-hashtag',
    items: [
      {
        key: 'tag_count',
        title: '태그 10개 채움',
        desc: '태그는 검색 노출에 직접 영향을 줘요. 최대 10개까지 채우는 게 유리해요.',
        max: 5,
        source: 'check',
        options: [
          { value: 1, label: '10개를 모두 채웠다' },
          { value: 0.5, label: '5~9개 채웠다' },
          { value: 0, label: '4개 이하이다' },
        ],
        guide: '태그를 10개까지 모두 채우세요.',
      },
      {
        key: 'tag_compose',
        title: '태그 키워드 구성',
        desc: '메인 키워드 2~3개 + 세부 키워드 4~5개 + 연관 키워드 2~3개 비율로 구성해요.',
        max: 4,
        source: 'check',
        options: [
          { value: 1, label: '메인/세부/연관 비율로 잘 구성했다' },
          { value: 0.5, label: '비슷한 키워드 위주이다' },
          { value: 0, label: '구성을 고려하지 않았다' },
        ],
        guide: '메인·세부·연관 키워드를 균형있게 배치하세요.',
      },
      {
        key: 'tag_no_abuse',
        title: '관련 없는 태그 없음',
        desc: '상품과 관련 없는 키워드 태그는 어뷰징으로 노출 불이익을 받아요.',
        max: 3,
        source: 'check',
        options: [
          { value: 1, label: '모두 상품과 관련된 태그다' },
          { value: 0, label: '관련 없는 태그가 섞여 있다' },
        ],
        guide: '상품과 무관한 인기 키워드 태그를 제거하세요.',
      },
    ],
  },
  {
    key: 'review',
    title: '리뷰·신뢰도',
    icon: 'fa-star',
    items: [
      {
        key: 'review_count',
        title: '리뷰 수',
        desc: '리뷰 수는 전환율과 노출에 큰 영향을 줘요. 초기 리뷰를 빠르게 쌓는 게 중요해요.',
        max: 5,
        source: 'auto',
        guide: '리뷰 이벤트/포인트로 초기 리뷰를 빠르게 확보하세요.',
      },
      {
        key: 'review_rating',
        title: '평균 별점',
        desc: '평균 별점이 높을수록 노출과 전환에 유리해요.',
        max: 3,
        source: 'auto',
        guide: '낮은 별점 리뷰의 원인(배송/품질/CS)을 개선하세요.',
      },
      {
        key: 'review_point',
        title: '리뷰 포인트 설정',
        desc: '구매 후 리뷰 작성 시 지급하는 포인트로 리뷰를 유도해요.',
        max: 3,
        source: 'check',
        options: [
          { value: 1, label: '리뷰 포인트를 설정했다' },
          { value: 0, label: '설정하지 않았다' },
        ],
        guide: '텍스트/포토 리뷰 포인트를 설정하세요.',
      },
      {
        key: 'review_photo_point',
        title: '포토리뷰 우대',
        desc: '포토 리뷰 포인트를 텍스트 리뷰보다 높게 설정하면 양질의 이미지 리뷰가 쌓여요.',
        max: 3,
        source: 'check',
        options: [
          { value: 1, label: '포토 리뷰 포인트가 더 높다' },
          { value: 0.5, label: '동일하게 설정했다' },
          { value: 0, label: '포토 리뷰 우대가 없다' },
        ],
        guide: '포토 리뷰 포인트를 텍스트 리뷰보다 높게 설정하세요.',
      },
    ],
  },
  {
    key: 'delivery',
    title: '배송·운영',
    icon: 'fa-truck',
    items: [
      {
        key: 'delivery_fee',
        title: '배송비 정확 설정',
        desc: '배송비가 애매하면 소비자가 이탈하고 검색 노출에도 영향을 줘요.',
        max: 3,
        source: 'check',
        options: [
          { value: 1, label: '무료/유료 배송비를 정확히 설정했다' },
          { value: 0, label: '애매하거나 미설정이다' },
        ],
        guide: '배송비를 명확히 설정하세요(무료배송 권장).',
      },
      {
        key: 'delivery_date',
        title: '출고 예정일 현실성',
        desc: '출고 지연이 반복되면 판매자 지수가 떨어져요. 지킬 수 있는 날짜로 설정해요.',
        max: 3,
        source: 'check',
        options: [
          { value: 1, label: '현실적으로 지킬 수 있게 설정했다' },
          { value: 0, label: '비현실적이거나 지연이 잦다' },
        ],
        guide: '실제 지킬 수 있는 출고 예정일로 설정하세요.',
      },
      {
        key: 'delivery_island',
        title: '제주/도서산간 배송비',
        desc: '해당 시 추가 배송비를 입력하지 않으면 클레임 사유가 돼요.',
        max: 2,
        source: 'check',
        options: [
          { value: 1, label: '입력했다 / 해당 없음' },
          { value: 0, label: '해당되는데 미입력이다' },
        ],
        guide: '제주/도서산간 추가 배송비를 입력하세요.',
      },
      {
        key: 'product_notice',
        title: '상품정보제공고시',
        desc: '법적 필수 항목이에요. 안 채우면 판매 제한이 걸릴 수 있어요.',
        max: 2,
        source: 'check',
        options: [
          { value: 1, label: '필수 항목을 모두 입력했다' },
          { value: 0.5, label: '"상품상세 참조"로 채웠다' },
          { value: 0, label: '입력하지 않았다' },
        ],
        guide: '상품정보제공고시 법적 필수 항목을 직접 입력하세요.',
      },
    ],
  },
]

/** 전체 만점 합계 (검증용) */
export const TOTAL_MAX = CRITERIA.reduce(
  (sum, g) => sum + g.items.reduce((s, it) => s + it.max, 0),
  0
)
