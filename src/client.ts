export const CLIENT_JS = `
(function(){
  'use strict';

  var CRITERIA = window.__CRITERIA__ || [];
  var state = { store: null, answers: {}, manual: {}, result: null };

  // ---- DOM helpers ----
  function $(id){ return document.getElementById(id); }
  function show(stageId){
    ['stage1','stage2','stage3'].forEach(function(s){
      $(s).classList.toggle('stage-active', s===stageId);
    });
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  // 자동 채점되는 항목 키 (체크리스트에서 자동 표시)
  var AUTO_KEYS = { name_length:1, img_quality:1, review_count:1, review_rating:1 };

  // ---- Stage 1: 입력 ----
  function validUrl(u){
    return /naver\\.(com|me)/.test(u) || /\\/products?\\//.test(u) || /\\d{5,}/.test(u);
  }

  $('startBtn').addEventListener('click', startDiagnose);
  $('urlInput').addEventListener('keydown', function(e){ if(e.key==='Enter') startDiagnose(); });
  $('skipUrlBtn').addEventListener('click', function(){
    state.store = null;
    show('stage2');
    renderChecklist(null);
  });

  function startDiagnose(){
    var url = $('urlInput').value.trim();
    var err = $('inputError');
    if(!url){ err.textContent='상품 URL을 입력해주세요.'; err.hidden=false; return; }
    if(!validUrl(url)){ err.textContent='올바른 스마트스토어 상품 URL인지 확인해주세요.'; err.hidden=false; return; }
    err.hidden=true;

    show('stage2');
    $('loadingBox').hidden=false;
    $('checklistBox').hidden=true;
    $('loadingText').textContent='상품 정보를 가져오는 중이에요…';

    fetch('/api/store?url='+encodeURIComponent(url))
      .then(function(r){ return r.json(); })
      .then(function(data){
        if(data.error){ throw new Error(data.error); }
        state.store = data;
        renderChecklist(data);
      })
      .catch(function(e){
        // 수집 실패해도 체크리스트로 진행
        state.store = null;
        renderChecklist(null, e.message);
      });
  }

  // ---- Stage 2: 자동수집 카드 + 체크리스트 ----
  function renderAutoCard(store, warnMsg){
    if(!store){
      return '<h3><i class="fas fa-triangle-exclamation"></i> 자동 수집 없음</h3>'+
        '<p style="font-size:14px;color:var(--gray-500)">'+
        esc(warnMsg||'URL 없이 체크리스트로만 진단해요. 아래 항목을 직접 입력/선택해주세요.')+'</p>';
    }

    // 자동 수집이 하나도 안 됐거나 네이버가 차단한 경우 → 직접 입력 안내
    var nothingCollected = !store.collected || store.collected.length===0;
    if(store.blocked || nothingCollected){
      var msg = store.blocked
        ? '네이버가 외부 자동 수집을 차단했어요. (스마트스토어는 플레이스와 달리 봇 접근이 막혀 있어요)'
        : '공개 페이지에서 정보를 가져오지 못했어요.';
      var html0 = '<h3><i class="fas fa-keyboard"></i> 직접 입력 모드</h3>';
      html0 += '<p style="font-size:14px;color:var(--gray-600);line-height:1.6">'+esc(msg)+
        '<br/>아래 <b>주황색 칸</b>에 상품명 글자수·이미지 수·리뷰 수·별점을 직접 입력하면 그 항목도 자동 채점돼요. 나머지는 체크리스트로 진단합니다.</p>';
      html0 += '<div class="auto-prod" style="margin-top:14px">';
      html0 += '<div><div class="pname">'+esc(store.name||store.storeName||'상품 #'+esc(store.productId))+'</div>'+
               '<div class="pmeta">상품 ID: '+esc(store.productId)+(store.storeName?(' · '+esc(store.storeName)):'')+'</div></div>';
      html0 += '</div>';
      return html0;
    }

    var price = store.price!=null ? store.price.toLocaleString()+'원' : '-';
    var html = '<h3><i class="fas fa-bolt"></i> 자동 수집 결과</h3>';
    html += '<div class="auto-prod">';
    html += store.imageUrl ? '<img src="'+esc(store.imageUrl)+'" alt="대표이미지" onerror="this.style.display=\\'none\\'"/>' : '';
    html += '<div><div class="pname">'+esc(store.name||'(상품명 미수집)')+'</div>'+
            '<div class="pmeta">'+esc(store.storeName||'스토어 미상')+(store.category?(' · '+esc(store.category)):'')+'</div></div>';
    html += '</div>';
    html += '<div class="auto-grid">';
    html += autoItem('상품명 길이', store.nameLength?store.nameLength+'자':'-');
    html += autoItem('판매가', price);
    html += autoItem('이미지 수', store.imageCount!=null?store.imageCount+'장':'미수집');
    html += autoItem('리뷰 수', store.reviewCount!=null?store.reviewCount.toLocaleString()+'개':'미수집');
    html += autoItem('평균 별점', store.starRating!=null?store.starRating.toFixed(2)+'점':'미수집');
    html += '</div>';
    if(store.notes && store.notes.length){
      store.notes.forEach(function(n){
        html += '<p class="auto-note"><i class="fas fa-circle-info"></i>'+esc(n)+'</p>';
      });
    }
    if(warnMsg){
      html += '<p class="auto-note"><i class="fas fa-circle-info"></i>'+esc(warnMsg)+'</p>';
    }
    return html;
  }
  function autoItem(k,v){ return '<div class="auto-item"><div class="k">'+esc(k)+'</div><div class="v">'+esc(v)+'</div></div>'; }

  function hasAutoValue(store, key){
    if(!store) return false;
    if(key==='name_length') return store.collected && store.collected.indexOf('name')>=0 && store.nameLength>0;
    if(key==='img_quality') return store.collected && store.collected.indexOf('imageCount')>=0 && store.imageCount!=null;
    if(key==='review_count') return store.collected && store.collected.indexOf('reviewCount')>=0 && store.reviewCount!=null;
    if(key==='review_rating') return store.collected && store.collected.indexOf('starRating')>=0 && store.starRating!=null;
    return false;
  }
  function autoValueLabel(store, key){
    if(key==='name_length') return store.nameLength+'자 (자동 채점)';
    if(key==='img_quality') return store.imageCount+'장 (자동 채점)';
    if(key==='review_count') return store.reviewCount.toLocaleString()+'개 (자동 채점)';
    if(key==='review_rating') return store.starRating.toFixed(2)+'점 (자동 채점)';
    return '자동 채점';
  }

  function renderChecklist(store, warnMsg){
    $('loadingBox').hidden=true;
    $('checklistBox').hidden=false;
    $('autoCard').outerHTML = '<div id="autoCard" class="auto-card">'+renderAutoCard(store, warnMsg)+'</div>';

    state.answers = {};
    var form = $('checklistForm');
    var html='';
    CRITERIA.forEach(function(g){
      html += '<div class="cl-group">';
      html += '<div class="cl-group-head"><i class="fas '+esc(g.icon)+'"></i>'+esc(g.title)+
              '<span class="gmax">'+groupMax(g)+'점</span></div>';
      g.items.forEach(function(it){
        html += '<div class="cl-item">';
        html += '<div class="cl-item-title">'+esc(it.title);
        var autoFilled = AUTO_KEYS[it.key] && hasAutoValue(store, it.key);
        html += autoFilled ? '<span class="badge badge-auto">자동</span>' : '<span class="badge badge-check">체크</span>';
        html += '<span class="badge badge-max">'+it.max+'점</span></div>';
        html += '<div class="cl-item-desc">'+esc(it.desc)+'</div>';

        if(autoFilled){
          html += '<div class="cl-auto-filled"><i class="fas fa-bolt"></i>'+esc(autoValueLabel(store,it.key))+'</div>';
        } else if(AUTO_KEYS[it.key]){
          // 자동 채점 항목인데 수집 실패 → 사용자가 직접 숫자 입력
          html += renderManualInput(it.key);
        } else if(it.options){
          html += '<div class="cl-options" data-key="'+esc(it.key)+'">';
          it.options.forEach(function(opt,i){
            html += '<label class="cl-opt"><input type="radio" name="'+esc(it.key)+'" value="'+opt.value+'"/>'+
                    '<span>'+esc(opt.label)+'</span></label>';
          });
          html += '</div>';
        }
        html += '</div>';
      });
      html += '</div>';
    });
    form.innerHTML = html;

    // 옵션 선택 핸들러
    form.querySelectorAll('.cl-opt').forEach(function(label){
      label.addEventListener('click', function(){
        var input = label.querySelector('input');
        var key = input.name;
        state.answers[key] = parseFloat(input.value);
        // 선택 표시
        form.querySelectorAll('input[name="'+key+'"]').forEach(function(inp){
          inp.closest('.cl-opt').classList.remove('selected');
        });
        label.classList.add('selected');
      });
    });

    // 수동 숫자 입력 핸들러 (자동수집 실패 시)
    form.querySelectorAll('.manual-input').forEach(function(inp){
      inp.addEventListener('input', function(){
        var key = inp.getAttribute('data-key');
        var v = inp.value.trim();
        state.manual[key] = v === '' ? null : parseFloat(v);
      });
    });
  }

  // 자동 항목별 수동 입력 UI (수집 실패 시 직접 입력 → 자동 채점에 반영)
  var MANUAL_META = {
    name_length:  { label:'상품명 글자수(공백 포함)', unit:'자',  ph:'예: 38' },
    img_quality:  { label:'등록한 이미지 수(대표 포함)', unit:'장', ph:'예: 8' },
    review_count: { label:'총 리뷰 수', unit:'개', ph:'예: 152' },
    review_rating:{ label:'평균 별점(0~5)', unit:'점', ph:'예: 4.8' }
  };
  function renderManualInput(key){
    var m = MANUAL_META[key]; if(!m) return '';
    return '<div class="manual-box"><i class="fas fa-keyboard"></i>'+
      '<span class="manual-label">'+esc(m.label)+'</span>'+
      '<input class="manual-input" data-key="'+esc(key)+'" type="number" inputmode="decimal" min="0" step="any" placeholder="'+esc(m.ph)+'"/>'+
      '<span class="manual-unit">'+esc(m.unit)+'</span></div>';
  }
  function groupMax(g){ return g.items.reduce(function(s,it){return s+it.max;},0); }

  $('backBtn').addEventListener('click', function(){ show('stage1'); });
  $('diagnoseBtn').addEventListener('click', submitDiagnose);

  function submitDiagnose(){
    $('diagnoseBtn').disabled=true;
    $('diagnoseBtn').innerHTML='<i class="fas fa-spinner fa-spin"></i> 분석 중…';

    // 자동수집 실패 항목에 사용자가 직접 입력한 값을 store에 병합
    var store = state.store ? JSON.parse(JSON.stringify(state.store)) : {
      productId:'-', storeName:null, name:'', nameLength:0, category:null, price:null,
      imageUrl:null, imageCount:null, reviewCount:null, starRating:null,
      collected:[], notes:[], blocked:false
    };
    var m = state.manual;
    function addCollected(k){ if(store.collected.indexOf(k)<0) store.collected.push(k); }
    if(m.name_length!=null && !isNaN(m.name_length)){ store.nameLength=m.name_length; if(!store.name) store.name='(직접 입력)'; addCollected('name'); }
    if(m.img_quality!=null && !isNaN(m.img_quality)){ store.imageCount=m.img_quality; addCollected('imageCount'); }
    if(m.review_count!=null && !isNaN(m.review_count)){ store.reviewCount=m.review_count; addCollected('reviewCount'); }
    if(m.review_rating!=null && !isNaN(m.review_rating)){ store.starRating=m.review_rating; addCollected('starRating'); }

    var payload = { store: store, answers: state.answers };

    fetch('/api/diagnose', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    })
    .then(function(r){ return r.json(); })
    .then(function(res){
      if(res.error) throw new Error(res.error);
      state.result = res;
      renderReport(res);
      show('stage3');
    })
    .catch(function(e){ alert('진단 실패: '+e.message); })
    .finally(function(){
      $('diagnoseBtn').disabled=false;
      $('diagnoseBtn').innerHTML='<i class="fas fa-chart-pie"></i> 결과 보기';
    });
  }

  // ---- Stage 3: 리포트 ----
  function fillClass(rate){ return rate>=80?'fill-good':rate>=50?'fill-warn':'fill-bad'; }
  function dotClass(st){ return st==='good'?'dot-good':st==='warn'?'dot-warn':st==='na'?'dot-na':'dot-bad'; }

  function renderReport(r){
    var html='';
    // 히어로 점수
    html += '<div class="report-hero">';
    html += '<div class="report-prodname">'+esc(r.name)+'</div>';
    html += '<div class="report-score">'+r.totalScore+'<small> / '+r.totalMax+'</small></div>';
    html += '<div class="report-grade"><b>'+esc(r.grade)+'등급</b> · '+esc(r.gradeLabel)+'</div>';
    html += '<div class="gauge"><div class="gauge-fill" style="width:0%"></div></div>';
    html += '</div>';

    // 랭킹 3대 축 (적합도 × 인기도 × 신뢰도)
    if(r.axes && r.axes.length){
      html += '<div class="report-section-title"><i class="fas fa-ranking-star"></i> 네이버 쇼핑검색 랭킹 3대 축</div>';
      html += '<div class="axis-formula">랭킹 = <b>적합도</b> × <b>인기도</b> × <b>신뢰도</b></div>';
      html += '<div class="axis-grid">';
      r.axes.forEach(function(ax){
        html += '<div class="axis-card" style="--axis:'+esc(ax.color)+'">';
        html += '<div class="axis-icon"><i class="fas '+esc(ax.icon)+'"></i></div>';
        html += '<div class="axis-title">'+esc(ax.title)+'</div>';
        html += '<div class="axis-sub">'+esc(ax.subtitle)+'</div>';
        html += '<div class="axis-score">'+ax.score+'<small> / '+ax.max+'</small></div>';
        html += '<div class="axis-bar"><div class="axis-bar-fill" style="width:0%" data-w="'+ax.rate+'"></div></div>';
        html += '<div class="axis-rate">'+ax.rate+'%</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    // 영역별
    html += '<div class="report-section-title"><i class="fas fa-layer-group"></i> 영역별 점수</div>';
    r.groups.forEach(function(g){
      html += '<div class="group-card">';
      html += '<div class="group-card-head"><div class="gicon"><i class="fas '+esc(g.icon)+'"></i></div>'+
              '<div class="gtitle">'+esc(g.title)+'</div>'+
              '<div class="gscore">'+g.score+'<small> / '+g.max+'</small></div></div>';
      html += '<div style="padding:0 22px 14px"><div class="gbar"><div class="gbar-fill '+fillClass(g.rate)+'" style="width:0%" data-w="'+g.rate+'"></div></div></div>';
      html += '<div class="group-items">';
      g.items.forEach(function(it){
        html += '<div class="gi-row"><div class="gi-dot '+dotClass(it.status)+'"></div>';
        html += '<div class="gi-title">'+esc(it.title)+'</div>';
        if(it.evaluatedBy==='auto' && it.autoValue) html += '<span class="gi-auto">'+esc(it.autoValue)+'</span>';
        html += '<div class="gi-score">'+it.score+'<small>/'+it.max+'</small></div></div>';
      });
      html += '</div></div>';
    });

    // 개선 우선순위
    if(r.topImprovements && r.topImprovements.length){
      html += '<div class="report-section-title"><i class="fas fa-screwdriver-wrench"></i> 개선 우선순위 TOP '+r.topImprovements.length+'</div>';
      html += '<div class="improve-card">';
      r.topImprovements.forEach(function(it,i){
        html += '<div class="improve-row"><div class="improve-rank">'+(i+1)+'</div>';
        html += '<div class="improve-body"><div class="it">'+esc(it.title)+'</div>';
        html += '<div class="ig">'+esc(it.guide)+'</div>';
        html += '<div class="iloss">-'+(it.max-it.score)+'점 손실 (현재 '+it.score+'/'+it.max+')</div></div></div>';
      });
      html += '</div>';
    }

    html += '<p class="report-disclaimer">본 결과는 네이버 공식 점수가 아닌 공개 자료 기반 최적화 가이드입니다. 참고용으로 활용하세요.</p>';

    $('reportBox').innerHTML = html;

    // 게이지 애니메이션
    setTimeout(function(){
      var rate = Math.round(r.totalScore / r.totalMax * 100);
      var gf = document.querySelector('.gauge-fill'); if(gf) gf.style.width = rate+'%';
      document.querySelectorAll('.gbar-fill').forEach(function(el){ el.style.width = el.getAttribute('data-w')+'%'; });
      document.querySelectorAll('.axis-bar-fill').forEach(function(el){ el.style.width = el.getAttribute('data-w')+'%'; });
    }, 100);
  }

  $('restartBtn').addEventListener('click', function(){
    state={store:null,answers:{},manual:{},result:null};
    $('urlInput').value='';
    show('stage1');
  });
  $('printBtn').addEventListener('click', function(){ window.print(); });

})();
`
