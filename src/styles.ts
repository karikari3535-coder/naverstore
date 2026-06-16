export const PAGE_CSS = `
:root{
  --green:#03c75a;        /* 네이버 그린 */
  --green-dark:#02b350;
  --green-soft:#e8faf0;
  --ink:#1a1a1a;
  --gray-900:#222;
  --gray-700:#4b5563;
  --gray-500:#6b7280;
  --gray-300:#d1d5db;
  --gray-200:#e5e7eb;
  --gray-100:#f3f4f6;
  --gray-50:#f9fafb;
  --bg:#f5f7f9;
  --white:#fff;
  --good:#03c75a;
  --warn:#f59e0b;
  --bad:#ef4444;
  --na:#9ca3af;
  --radius:16px;
  --shadow:0 4px 24px rgba(0,0,0,.06);
  --shadow-lg:0 12px 40px rgba(0,0,0,.10);
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{font-family:'Pretendard',-apple-system,BlinkMacSystemFont,system-ui,sans-serif;color:var(--ink);background:var(--bg);line-height:1.6;-webkit-font-smoothing:antialiased}
.wrap{max-width:840px;margin:0 auto;padding:0 20px}
b{font-weight:700}
button{font-family:inherit;cursor:pointer}
.br-pc{display:inline}
@media(max-width:640px){.br-pc{display:none}}

/* ===== 헤더 ===== */
.site-header{background:var(--white);border-bottom:1px solid var(--gray-200);position:sticky;top:0;z-index:50}
.header-inner{display:flex;align-items:center;justify-content:space-between;height:60px}
.logo{display:flex;align-items:center;gap:10px;font-weight:800;font-size:18px}
.logo i{color:var(--green);font-size:22px}
.header-sub{font-size:13px;color:var(--gray-500)}
@media(max-width:480px){.header-sub{display:none}}

/* ===== 스테이지 전환 ===== */
.stage{display:none;animation:fade .35s ease}
.stage-active{display:block}
@keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

/* ===== HERO ===== */
.hero{padding:48px 0 60px;text-align:center}
.hero-title{font-size:34px;font-weight:800;line-height:1.3;letter-spacing:-.5px}
.hero-title b{color:var(--green)}
.hero-desc{margin-top:16px;color:var(--gray-700);font-size:16px}
@media(max-width:640px){.hero{padding:32px 0 40px}.hero-title{font-size:26px}.hero-desc{font-size:15px}}

/* ===== 입력 카드 ===== */
.input-card{background:var(--white);border-radius:var(--radius);box-shadow:var(--shadow);padding:28px;margin:36px auto 0;max-width:680px;text-align:left}
.input-label{display:flex;align-items:center;gap:8px;font-weight:700;font-size:14px;color:var(--gray-700);margin-bottom:12px}
.input-label i{color:var(--green)}
.input-row{display:flex;gap:10px}
#urlInput{flex:1;min-width:0;border:1.5px solid var(--gray-300);border-radius:12px;padding:14px 16px;font-size:15px;transition:border-color .2s}
#urlInput:focus{outline:none;border-color:var(--green)}
@media(max-width:560px){.input-row{flex-direction:column}}

/* ===== 버튼 ===== */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:none;border-radius:12px;padding:14px 22px;font-size:15px;font-weight:700;transition:transform .12s,box-shadow .2s,background .2s;white-space:nowrap}
.btn:active{transform:scale(.98)}
.btn-primary{background:var(--green);color:#fff;box-shadow:0 4px 14px rgba(3,199,90,.32)}
.btn-primary:hover{background:var(--green-dark)}
.btn-secondary{background:var(--ink);color:#fff}
.btn-ghost{background:var(--gray-100);color:var(--gray-700)}
.btn-ghost:hover{background:var(--gray-200)}
.link-btn{background:none;border:none;color:var(--gray-500);font-size:14px;margin-top:14px;text-decoration:underline;text-underline-offset:3px}
.link-btn:hover{color:var(--green)}
.input-error{margin-top:12px;color:var(--bad);font-size:14px;font-weight:600}

/* ===== 기능 리스트 ===== */
.feature-list{list-style:none;margin:34px auto 0;max-width:560px;display:flex;flex-direction:column;gap:12px}
.feature-list li{display:flex;align-items:center;gap:12px;background:var(--white);border:1px solid var(--gray-200);border-radius:12px;padding:14px 18px;font-size:14px;color:var(--gray-700);text-align:left}
.feature-list i{color:var(--green);width:20px;text-align:center}
.disclaimer{margin-top:28px;font-size:13px;color:var(--gray-500);display:flex;align-items:center;justify-content:center;gap:6px}

/* ===== 로딩 ===== */
.loading-box{padding:80px 0;text-align:center}
.spinner{width:48px;height:48px;border:4px solid var(--gray-200);border-top-color:var(--green);border-radius:50%;margin:0 auto 20px;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
#loadingText{color:var(--gray-700);font-size:15px}

/* ===== 자동수집 카드 ===== */
.auto-card{background:var(--white);border-radius:var(--radius);box-shadow:var(--shadow);padding:22px;margin:28px 0 20px}
.auto-card h3{font-size:15px;display:flex;align-items:center;gap:8px;margin-bottom:14px}
.auto-card h3 i{color:var(--green)}
.auto-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px}
.auto-item{background:var(--gray-50);border-radius:10px;padding:12px 14px}
.auto-item .k{font-size:12px;color:var(--gray-500)}
.auto-item .v{font-size:16px;font-weight:700;margin-top:2px}
.auto-prod{display:flex;align-items:center;gap:14px;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--gray-200)}
.auto-prod img{width:64px;height:64px;border-radius:10px;object-fit:cover;background:var(--gray-100);flex-shrink:0}
.auto-prod .pname{font-weight:700;font-size:15px;line-height:1.4}
.auto-prod .pmeta{font-size:13px;color:var(--gray-500);margin-top:3px}
.auto-note{margin-top:14px;font-size:13px;color:var(--warn);display:flex;gap:6px;align-items:flex-start}

/* ===== 체크리스트 ===== */
.checklist-head{margin:8px 0 20px}
.checklist-head h2{font-size:20px;display:flex;align-items:center;gap:8px}
.checklist-head h2 i{color:var(--green)}
.checklist-head p{font-size:14px;color:var(--gray-500);margin-top:6px}
.cl-group{background:var(--white);border-radius:var(--radius);box-shadow:var(--shadow);margin-bottom:18px;overflow:hidden}
.cl-group-head{display:flex;align-items:center;gap:10px;padding:18px 22px;background:var(--green-soft);font-weight:700;font-size:15px}
.cl-group-head i{color:var(--green)}
.cl-group-head .gmax{margin-left:auto;font-size:13px;color:var(--gray-500);font-weight:600}
.cl-item{padding:18px 22px;border-top:1px solid var(--gray-100)}
.cl-item:first-of-type{border-top:none}
.cl-item-title{font-weight:700;font-size:15px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.badge{font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px}
.badge-auto{background:#e0f2fe;color:#0369a1}
.badge-check{background:#fef3c7;color:#92400e}
.badge-max{background:var(--gray-100);color:var(--gray-500);margin-left:auto}
.cl-item-desc{font-size:13px;color:var(--gray-500);margin:6px 0 12px}
.cl-options{display:flex;flex-direction:column;gap:8px}
.cl-opt{display:flex;align-items:center;gap:10px;border:1.5px solid var(--gray-200);border-radius:10px;padding:12px 14px;font-size:14px;cursor:pointer;transition:border-color .15s,background .15s}
.cl-opt:hover{border-color:var(--green)}
.cl-opt input{accent-color:var(--green);width:18px;height:18px}
.cl-opt.selected{border-color:var(--green);background:var(--green-soft)}
.cl-auto-filled{font-size:13px;color:var(--green);font-weight:600;display:flex;align-items:center;gap:6px;background:var(--green-soft);border-radius:10px;padding:12px 14px}
.checklist-actions{display:flex;gap:12px;margin:8px 0 40px}
.checklist-actions .btn{flex:1}

/* ===== 리포트 ===== */
.report-hero{background:linear-gradient(135deg,var(--green) 0%,var(--green-dark) 100%);color:#fff;border-radius:var(--radius);padding:32px;text-align:center;margin:28px 0 22px;box-shadow:var(--shadow-lg)}
.report-prodname{font-size:14px;opacity:.9}
.report-score{font-size:64px;font-weight:800;line-height:1;margin:10px 0 4px}
.report-score small{font-size:24px;font-weight:600;opacity:.8}
.report-grade{display:inline-block;font-size:15px;font-weight:700;background:rgba(255,255,255,.22);padding:6px 18px;border-radius:30px;margin-top:8px}
.report-grade b{font-size:18px}
.gauge{height:10px;background:rgba(255,255,255,.25);border-radius:10px;margin:20px auto 0;max-width:420px;overflow:hidden}
.gauge-fill{height:100%;background:#fff;border-radius:10px;transition:width 1s ease}

.report-section-title{font-size:18px;font-weight:800;margin:30px 0 14px;display:flex;align-items:center;gap:8px}
.report-section-title i{color:var(--green)}

/* 영역별 점수 카드 */
.group-card{background:var(--white);border-radius:var(--radius);box-shadow:var(--shadow);margin-bottom:16px;overflow:hidden}
.group-card-head{display:flex;align-items:center;gap:12px;padding:18px 22px;border-bottom:1px solid var(--gray-100)}
.group-card-head .gicon{width:38px;height:38px;border-radius:10px;background:var(--green-soft);display:flex;align-items:center;justify-content:center;color:var(--green);font-size:16px;flex-shrink:0}
.group-card-head .gtitle{font-weight:700;font-size:15px}
.group-card-head .gscore{margin-left:auto;font-weight:800;font-size:16px}
.group-card-head .gscore small{color:var(--gray-400);font-weight:600;font-size:13px}
.gbar{height:8px;background:var(--gray-100);border-radius:8px;overflow:hidden}
.gbar-fill{height:100%;border-radius:8px;transition:width .8s ease}
.fill-good{background:var(--good)}.fill-warn{background:var(--warn)}.fill-bad{background:var(--bad)}
.group-items{padding:6px 22px 14px}
.gi-row{display:flex;align-items:center;gap:10px;padding:11px 0;border-top:1px solid var(--gray-100);font-size:14px}
.gi-row:first-child{border-top:none}
.gi-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.dot-good{background:var(--good)}.dot-warn{background:var(--warn)}.dot-bad{background:var(--bad)}.dot-na{background:var(--na)}
.gi-title{flex:1;font-weight:600}
.gi-auto{font-size:12px;color:#0369a1;background:#e0f2fe;padding:1px 8px;border-radius:10px}
.gi-score{font-weight:700;color:var(--gray-700)}
.gi-score small{color:var(--gray-400);font-weight:500}

/* 개선 우선순위 */
.improve-card{background:var(--white);border-radius:var(--radius);box-shadow:var(--shadow);padding:8px 22px}
.improve-row{display:flex;gap:14px;padding:16px 0;border-top:1px solid var(--gray-100)}
.improve-row:first-child{border-top:none}
.improve-rank{width:28px;height:28px;border-radius:50%;background:var(--bad);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;flex-shrink:0}
.improve-row:nth-child(n+3) .improve-rank{background:var(--warn)}
.improve-body .it{font-weight:700;font-size:14px}
.improve-body .ig{font-size:13px;color:var(--gray-500);margin-top:4px}
.improve-body .iloss{font-size:12px;color:var(--bad);font-weight:600;margin-top:4px}

.report-actions{display:flex;gap:12px;margin:24px 0 50px}
.report-actions .btn{flex:1}
.report-disclaimer{font-size:12px;color:var(--gray-400);text-align:center;margin:8px 0 30px}

/* ===== 푸터 ===== */
.site-footer{background:var(--white);border-top:1px solid var(--gray-200);padding:28px 0;text-align:center;margin-top:20px}
.site-footer p{font-size:13px;color:var(--gray-500)}
.footer-sub{font-size:12px;color:var(--gray-400);margin-top:6px}

@media print{
  .site-header,.site-footer,.report-actions{display:none}
  body{background:#fff}
}
`
