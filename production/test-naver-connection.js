// test-naver-connection.js
// 실행: node --env-file=.env.local test-naver-connection.js
//      (Node 20+ 는 --env-file 내장. 구버전이면 dotenv 사용)
//      또는: npm run test:naver
const crypto = require('crypto');

const {
  NAVER_API_KEY, NAVER_SECRET_KEY, NAVER_CUSTOMER_ID,
  NAVER_SHOP_ID, NAVER_SHOP_SECRET,
} = process.env;

// ── (A) 검색광고 API: 키워드 검색량 ──
function adSignature(ts, method, path) {
  return crypto.createHmac('sha256', NAVER_SECRET_KEY)
    .update(`${ts}.${method}.${path}`).digest('base64');
}

async function testSearchAd(keyword) {
  const path = '/keywordstool';
  const ts = Date.now().toString();
  const qs = new URLSearchParams({ hintKeywords: keyword, showDetail: '1' });
  const res = await fetch(`https://api.searchad.naver.com${path}?${qs}`, {
    headers: {
      'X-Timestamp': ts,
      'X-API-KEY': NAVER_API_KEY,
      'X-Customer': NAVER_CUSTOMER_ID,
      'X-Signature': adSignature(ts, 'GET', path),
    },
  });
  if (!res.ok) throw new Error(`검색광고 API 실패: ${res.status} ${await res.text()}`);
  const data = await res.json();
  console.log(`\n✅ [검색광고 API] "${keyword}" 연관 키워드 ${data.keywordList.length}개`);
  data.keywordList.slice(0, 5).forEach(k => {
    const pc = String(k.monthlyPcQcCnt).replace('<', '').trim();
    const mo = String(k.monthlyMobileQcCnt).replace('<', '').trim();
    console.log(`   - ${k.relKeyword}: PC ${pc} + 모바일 ${mo} (경쟁: ${k.compIdx})`);
  });
}

// ── (B) 검색(쇼핑) API: 상위 상품명 ──
async function testShop(keyword) {
  if (!NAVER_SHOP_ID || !NAVER_SHOP_SECRET) {
    console.log('\n⏭️  [쇼핑 API] NAVER_SHOP_ID / NAVER_SHOP_SECRET 미설정 — 건너뜀');
    console.log('   (사이트 배포 후 도메인이 나오면 developers.naver.com 에서 발급해 채우세요.)');
    return;
  }
  const qs = new URLSearchParams({ query: keyword, display: '5', sort: 'sim' });
  const res = await fetch(`https://openapi.naver.com/v1/search/shop.json?${qs}`, {
    headers: {
      'X-Naver-Client-Id': NAVER_SHOP_ID,
      'X-Naver-Client-Secret': NAVER_SHOP_SECRET,
    },
  });
  if (!res.ok) throw new Error(`쇼핑 API 실패: ${res.status} ${await res.text()}`);
  const data = await res.json();
  console.log(`\n✅ [쇼핑 API] "${keyword}" 상위 상품명 (총 ${data.total.toLocaleString()}개 중 5개)`);
  data.items.forEach((it, i) => {
    console.log(`   ${i + 1}. ${it.title.replace(/<[^>]+>/g, '')}  [${it.category3 || it.category2}]`);
  });
}

(async () => {
  try {
    console.log('🔍 네이버 API 연결 테스트 시작…');
    await testSearchAd('대저토마토');
    await testShop('대저토마토');
    console.log('\n🎉 연결 테스트 완료!');
  } catch (e) {
    console.error('\n❌ 연결 실패:', e.message);
    console.error('→ 키 값, 권한 설정(쇼핑 API는 "검색" 체크), 서명 방식을 확인하세요.');
    process.exit(1);
  }
})();
