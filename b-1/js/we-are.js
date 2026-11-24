/* 03 History + 04 Partners — 스크롤 진행도(p) 구동
   A(p<.10) 화면 가득 한 줄 → B(.10~.30) 축소·좌우로 벌어짐+괘선 → C(.30~.78) 연도·내용 5단계 롤
   → D(.78~1) 헤더 줄이 위로 이동, 파트너 로고 등장(partners.js) */
(function(){
  var wrap=document.getElementById('weare');
  if(!wrap) return;
  var items=[].slice.call(wrap.querySelectorAll('.hr-item'));
  var n=items.length;
  var L=wrap.querySelector('.hr-l'), R=wrap.querySelector('.hr-r'), line=wrap.querySelector('.hr-line');
  if(!n||!L||!R||!line) return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){
    // 모션 축소: 연출 없이 전부 표시 (CSS가 정적 배치)
    wrap.classList.add('is-c','is-d');
    return;
  }
  var A_END=.10, B_END=.30, C_END=.78;
  var head=wrap.querySelector('.hr-head'), hyTo=0, hyNow=0, hyMax=0;
  var cur=-1, m=null, eNow=0, eTo=0, raf=0;

  // 최종 배치 실측: 좌·우 조각 위치, 괘선 길이, 시작(화면 가득) 배율
  function measure(){
    L.style.transform=R.style.transform=line.style.transform='none';
    var lr=L.getBoundingClientRect(), rr=R.getBoundingClientRect(), ln=line.getBoundingClientRect();
    var fs=parseFloat(getComputedStyle(L).fontSize);
    var pad=parseFloat(getComputedStyle(L.parentNode).left)||0;
    var avail=window.innerWidth-pad*2;
    var sp=fs*.3;                                   // 단어 사이 한 칸
    var total=lr.width+sp+rr.width;
    var S=avail*.97/total;
    var cx=window.innerWidth/2, x0=cx-S*total/2;
    m={S:S, cx:cx, lL:lr.left, lW:lr.width, rR:rr.right, rW:rr.width,
       dL:x0-lr.left, dR:(x0+S*total)-rr.right,
       gap:ln.left-lr.right, half:ln.width/2};
    // D 단계 헤더 목표 위치: 상단 내비 아래 약 16svh
    var vh=window.innerHeight, hh=head.offsetHeight;
    var target=Math.max(vh*.16,68+hh/2+20);
    hyMax=target-vh/2;
    wrap.style.setProperty('--ht',(target+hh/2)+'px');
    render(eNow);
  }

  // e(0~1) 상태 그리기
  function render(e){
    if(!m) return;
    var s=m.S+(1-m.S)*e;
    var dl=m.dL*(1-e), dr=m.dR*(1-e);
    L.style.transform='translateX('+dl+'px) scale('+s+')';
    R.style.transform='translateX('+dr+'px) scale('+s+')';
    // 괘선: 중앙에서 바깥으로, 좌우 글자와 간격 유지
    var lEdge=m.lL+dl+m.lW*s, rEdge=m.rR+dr-m.rW*s;
    var h=Math.min(m.cx-lEdge,rEdge-m.cx)-m.gap;
    line.style.transform='scaleX('+Math.max(0,Math.min(1,h/m.half))+')';
  }

  // 한 프레임씩 목표값으로 보간
  function tick(){
    eNow+=(eTo-eNow)*.28;
    if(Math.abs(eTo-eNow)<.001) eNow=eTo;
    hyNow+=(hyTo-hyNow)*.28;
    if(Math.abs(hyTo-hyNow)<.002) hyNow=hyTo;
    render(eNow);
    wrap.style.setProperty('--hy',(hyMax*hyNow).toFixed(2)+'px');
    raf=(eNow!==eTo||hyNow!==hyTo)?requestAnimationFrame(tick):0;
  }

  // 활성 인덱스 적용 (-1 = 전부 대기)
  function apply(idx){
    if(idx===cur) return;
    cur=idx;
    wrap.classList.toggle('is-c',idx>=0);
    items.forEach(function(el,i){
      el.classList.toggle('is-prev',idx>=0&&i<idx);
      el.classList.toggle('is-on',i===idx);
      el.setAttribute('aria-hidden',i===idx?'false':'true');
    });
  }

  function onScroll(){
    var rect=wrap.getBoundingClientRect();
    var total=wrap.offsetHeight-window.innerHeight;
    var p=total>0?Math.min(1,Math.max(0,-rect.top/total)):1;
    var t=Math.min(1,Math.max(0,(p-A_END)/(B_END-A_END)));
    eTo=t*t*(3-2*t);                                // smoothstep
    // D: 헤더 줄 위로(스크럽), 이후 로고 등장
    var d=Math.min(1,Math.max(0,(p-C_END)/(1-C_END)));
    var u=Math.min(1,d/.45);
    hyTo=u*u*(3-2*u);
    if(!raf) raf=requestAnimationFrame(tick);
    wrap.classList.toggle('is-d',d>=.4);
    // n = 전부 지나감(2026도 빠져나감)
    apply(p<B_END?-1:p>=C_END?n:Math.min(n-1,Math.floor((p-B_END)/(C_END-B_END)*n)));
  }

  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',function(){ measure(); onScroll(); });
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(measure);
  measure(); onScroll();
})();
