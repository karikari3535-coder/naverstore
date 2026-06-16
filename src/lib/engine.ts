/**
 * 스마트스토어 자가진단 엔진
 *
 * 입력:
 *  - store: 공개 페이지에서 자동 수집한 데이터 (StoreData)
 *  - answers: 사용자 체크리스트 응답 { [itemKey]: optionValue(0~1) }
 *
 * 출력:
 *  - 항목별 점수/등급, 영역별 합계, 총점/등급, 개선 우선순위(Top)
 */

import { CRITERIA, CriteriaItem } from './criteria'
import type { StoreData } from './smartstore'

export interface ItemResult {
  key: string
  title: string
  desc: string
  max: number
  score: number
  source: string
  /** 자동 평가된 실제 값(있으면 표시) */
  autoValue?: string
  /** 'auto' | 'check' | 'na' — 어떤 방식으로 평가됐는지 */
  evaluatedBy: 'auto' | 'check' | 'na'
  guide: string
  /** 항목 상태: good(80%+) / warn(50~80) / bad(<50) / na */
  status: 'good' | 'warn' | 'bad' | 'na'
}

export interface GroupResult {
  key: string
  title: string
  icon: string
  score: number
  max: number
  rate: number // 0~100
  items: ItemResult[]
}

export interface DiagnoseResult {
  productId: string
  storeName: string | null
  name: string
  category: string | null
  price: number | null
  imageUrl: string | null
  totalScore: number
  totalMax: number
  grade: string
  gradeLabel: string
  groups: GroupResult[]
  /** 개선 우선 항목 (감점 큰 순) */
  topImprovements: ItemResult[]
  /** 자동 수집 요약 */
  autoSummary: {
    collected: string[]
    notes: string[]
    reviewCount: number | null
    starRating: number | null
    imageCount: number | null
    nameLength: number
  }
}

/* ------------------------------------------------------------------ */
/* 자동 항목 채점 함수                                                  */
/* ------------------------------------------------------------------ */

/**
 * 자동 항목을 채점한다. 자동 수집 실패 시 null 반환 → 체크리스트로 폴백.
 * 반환: { score(0~max), value(표시문자열) }
 */
function scoreAuto(
  item: CriteriaItem,
  store: StoreData
): { score: number; value: string } | null {
  switch (item.key) {
    case 'name_length': {
      if (!store.collected.includes('name') || store.nameLength === 0) return null
      const len = store.nameLength
      let ratio: number
      if (len >= 25 && len <= 50) ratio = 1
      else if (len >= 15 && len < 25) ratio = 0.6
      else if (len > 50 && len <= 60) ratio = 0.7
      else if (len > 60) ratio = 0.4
      else ratio = 0.3 // 15자 미만
      return { score: Math.round(item.max * ratio), value: `${len}자` }
    }
    case 'img_count': {
      if (!store.collected.includes('imageCount') || store.imageCount === null) return null
      const cnt = store.imageCount
      let ratio: number
      if (cnt >= 8) ratio = 1
      else if (cnt >= 5) ratio = 0.7
      else if (cnt >= 3) ratio = 0.5
      else ratio = 0.3
      return { score: Math.round(item.max * ratio), value: `${cnt}장` }
    }
    case 'review_count': {
      if (!store.collected.includes('reviewCount') || store.reviewCount === null) return null
      const cnt = store.reviewCount
      let ratio: number
      if (cnt >= 100) ratio = 1
      else if (cnt >= 30) ratio = 0.8
      else if (cnt >= 10) ratio = 0.6
      else if (cnt >= 1) ratio = 0.4
      else ratio = 0.1
      return { score: Math.round(item.max * ratio), value: `${cnt.toLocaleString()}개` }
    }
    case 'review_rating': {
      if (!store.collected.includes('starRating') || store.starRating === null) return null
      const r = store.starRating
      let ratio: number
      if (r >= 4.8) ratio = 1
      else if (r >= 4.5) ratio = 0.8
      else if (r >= 4.0) ratio = 0.6
      else if (r >= 3.0) ratio = 0.4
      else ratio = 0.2
      return { score: Math.round(item.max * ratio), value: `${r.toFixed(2)}점` }
    }
    default:
      return null
  }
}

/* ------------------------------------------------------------------ */
/* 등급 산정                                                            */
/* ------------------------------------------------------------------ */

function calcGrade(score: number): { grade: string; label: string } {
  if (score >= 90) return { grade: 'S', label: '최적화 완료' }
  if (score >= 80) return { grade: 'A', label: '우수' }
  if (score >= 70) return { grade: 'B', label: '양호' }
  if (score >= 55) return { grade: 'C', label: '개선 필요' }
  return { grade: 'D', label: '집중 개선 필요' }
}

function itemStatus(score: number, max: number): 'good' | 'warn' | 'bad' {
  const r = max ? score / max : 0
  if (r >= 0.8) return 'good'
  if (r >= 0.5) return 'warn'
  return 'bad'
}

/* ------------------------------------------------------------------ */
/* 메인 진단                                                            */
/* ------------------------------------------------------------------ */

export function diagnose(
  store: StoreData,
  answers: Record<string, number>
): DiagnoseResult {
  const groups: GroupResult[] = []
  let totalScore = 0
  let totalMax = 0
  const allItems: ItemResult[] = []

  for (const g of CRITERIA) {
    const items: ItemResult[] = []
    let gScore = 0
    let gMax = 0

    for (const it of g.items) {
      gMax += it.max
      totalMax += it.max

      let score = 0
      let evaluatedBy: 'auto' | 'check' | 'na' = 'na'
      let autoValue: string | undefined

      // 1) auto / hybrid → 자동 채점 시도
      if (it.source === 'auto' || it.source === 'hybrid') {
        const auto = scoreAuto(it, store)
        if (auto) {
          score = auto.score
          autoValue = auto.value
          evaluatedBy = 'auto'
        }
      }

      // 2) 자동 실패 또는 check 항목 → 체크리스트 응답 사용
      if (evaluatedBy === 'na' && (it.source === 'check' || it.source === 'hybrid' || it.source === 'auto')) {
        const ans = answers[it.key]
        if (typeof ans === 'number') {
          score = Math.round(it.max * ans)
          evaluatedBy = 'check'
        }
      }

      // 3) 그래도 응답 없으면 미평가(na) — 점수 0, 만점에서는 제외하지 않고 0점 처리
      const status: ItemResult['status'] =
        evaluatedBy === 'na' ? 'na' : itemStatus(score, it.max)

      gScore += score
      totalScore += score

      const result: ItemResult = {
        key: it.key,
        title: it.title,
        desc: it.desc,
        max: it.max,
        score,
        source: it.source,
        autoValue,
        evaluatedBy,
        guide: it.guide,
        status,
      }
      items.push(result)
      allItems.push(result)
    }

    groups.push({
      key: g.key,
      title: g.title,
      icon: g.icon,
      score: gScore,
      max: gMax,
      rate: gMax ? Math.round((gScore / gMax) * 100) : 0,
      items,
    })
  }

  const { grade, label } = calcGrade(totalScore)

  // 개선 우선순위: 감점(max-score)이 큰 순, 동점이면 max 큰 순
  const topImprovements = [...allItems]
    .filter((i) => i.score < i.max)
    .sort((a, b) => b.max - b.score - (a.max - a.score) || b.max - a.max)
    .slice(0, 5)

  return {
    productId: store.productId,
    storeName: store.storeName,
    name: store.name || '(상품명 미수집)',
    category: store.category,
    price: store.price,
    imageUrl: store.imageUrl,
    totalScore,
    totalMax,
    grade,
    gradeLabel: label,
    groups,
    topImprovements,
    autoSummary: {
      collected: store.collected,
      notes: store.notes,
      reviewCount: store.reviewCount,
      starRating: store.starRating,
      imageCount: store.imageCount,
      nameLength: store.nameLength,
    },
  }
}
