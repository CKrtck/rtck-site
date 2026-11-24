/* 05 Symbol — 심볼 위에서 포인터를 CONTACT 배지로 바꾸고, 클릭하면 #contact 로 이동
   + 섹션이 가까워지면 3D 심볼(js/symbol3d.js, three.js 번들)을 지연 로드.
     성공 시 섹션에 is-live → 기존 img 숨김. 실패 시 img 그대로 */
(function(){
  var sec=document.getElementById('symbol'); if(!sec) return;
  var img=sec.querySelector('.sy-img'), badge=sec.querySelector('.sy-badge');
  if(!img) return;
  var fine=matchMedia('(hover: hover) and (pointer: fine)').matches;
  var calm=matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 3D 지연 로드 ---------- */
  var src=sec.getAttribute('data-three'), loaded=false;
  function webgl(){
    try{ var c=document.createElement('canvas'); return !!(window.WebGLRenderingContext&&(c.getContext('webgl2')||c.getContext('webgl'))); }
    catch(e){ return false; }
  }
  function mount(){
    try{ if(window.RTCKSymbol3D) window.RTCKSymbol3D.mount(sec,img,{interactive:fine&&!calm}); }catch(e){}
  }
  function load(){
    if(loaded||!src||!webgl()) return; loaded=true;
    if(window.RTCKSymbol3D){ mount(); return; }
    var s=document.createElement('script'); s.src=src; s.async=true;
    s.onload=mount; s.onerror=function(){};
    document.body.appendChild(s);
  }
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){
      if(es[0].isIntersecting){ io.disconnect(); load(); }
    },{rootMargin:'150% 0px'});
    io.observe(sec);
  } else load();

  /* ---------- CONTACT 배지 ---------- */
  if(!badge||!fine) return;
  var over=false;
  // 심볼 영역: 이미지 상자에 내접하는 타원(약간 안쪽)
  function hit(e){
    // 하단 문구 근처(섹션 아래 20%)에서는 배지를 숨김 → 유리에 새긴 글씨를 가리지 않음
    var sr=sec.getBoundingClientRect(); if(e.clientY>sr.bottom-sr.height*.2) return false;
    var r=img.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
    var dx=(e.clientX-cx)/(r.width*.47), dy=(e.clientY-cy)/(r.height*.47);
    return dx*dx+dy*dy<=1;
  }
  function setOver(v){ if(v===over) return; over=v; sec.classList.toggle('is-over',v); }
  sec.addEventListener('pointermove',function(e){
    if(e.pointerType!=='mouse') return;
    var h=hit(e); setOver(h);
    if(h) badge.style.transform='translate('+e.clientX+'px,'+e.clientY+'px) translate(-50%,-50%)';
  },{passive:true});
  sec.addEventListener('pointerleave',function(){ setOver(false); },{passive:true});
  sec.addEventListener('click',function(e){
    if(!over||e.target.closest('a')) return;
    var t=document.getElementById('contact'); if(t) t.scrollIntoView({behavior:'smooth'});
  });
})();
