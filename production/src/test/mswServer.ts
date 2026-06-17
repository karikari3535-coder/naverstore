import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const keywordToolResponse = {
  keywordList: [
    { relKeyword: '부산',       monthlyPcQcCnt: 4800,  monthlyMobileQcCnt: 10000, compIdx: '높음' },
    { relKeyword: '방울토마토',  monthlyPcQcCnt: 3100,  monthlyMobileQcCnt: 15000, compIdx: '높음' },
    { relKeyword: '고당도',     monthlyPcQcCnt: 1100,  monthlyMobileQcCnt: 7000,  compIdx: '중간' },
    { relKeyword: '제철',       monthlyPcQcCnt: 900,   monthlyMobileQcCnt: 9000,  compIdx: '낮음' },
    { relKeyword: '짭짤이',     monthlyPcQcCnt: 200,   monthlyMobileQcCnt: 3000,  compIdx: '낮음' },
    { relKeyword: '완숙',       monthlyPcQcCnt: 400,   monthlyMobileQcCnt: 2500,  compIdx: '낮음' },
    { relKeyword: '대저토마토',  monthlyPcQcCnt: 680,   monthlyMobileQcCnt: 4000,  compIdx: '중간' },
    { relKeyword: '희소키워드',  monthlyPcQcCnt: '< 10', monthlyMobileQcCnt: '< 10', compIdx: '낮음' },
  ],
};

const cat = {
  category1: '식품', category2: '농산물', category3: '과일', category4: '토마토',
};

const shopResponse = {
  total: 123456,
  items: [
    { title: '<b>부산</b> 짭짤이 대저토마토 고당도 방울토마토 1kg', ...cat },
    { title: '부산 대저토마토 완숙 제철 방울토마토 세트 5kg', ...cat },
    { title: '짭짤이 토마토 부산 고당도 완숙 못난이 2kg', ...cat },
    { title: '대저토마토 방울토마토 부산 짭짤이 묶음 박스', ...cat },
    ...Array(36).fill({ title: '부산 대저토마토 짭짤이 완숙 방울토마토', ...cat }),
  ],
};

export const handlers = [
  http.get('https://api.searchad.naver.com/keywordstool', () =>
    HttpResponse.json(keywordToolResponse)),
  http.get('https://openapi.naver.com/v1/search/shop.json', () =>
    HttpResponse.json(shopResponse)),
];

export const server = setupServer(...handlers);
