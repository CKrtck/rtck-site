/* Parts 장면 1: 스크롤 진행도를 CSS 변수로 넘김
   --pzp (0~1): 이미지 움직임 / --pzq (0~1): 블러·그레인 레이어와 문구가 나타나는 정도(어두운 장면 전용)
   .pz-run(스크롤 구간)이 있으면 그 길이만큼, 없으면 화면 한 장 높이만큼을 진행 구간으로 씀 */
(function(){
  var s=document.querySelector('.pz'); if(!s) return;
  var runEl=document.querySelector('.pz-run'), tick=false;
  function run(){ tick=false;
    var len=(runEl&&runEl.offsetHeight)||window.innerHeight||1, p=Math.max(0,Math.min(1,window.scrollY/len));
    /* 구간 배분: 앞 42% 동안 확대·블러·문구가 함께 진행 → 나머지 58%는 그대로 머무름(본문 읽는 시간) */
    var q=Math.max(0,Math.min(1,(p-.03)/.39)); q=q*q*(3-2*q);
    s.style.setProperty('--pzp',p.toFixed(4)); s.style.setProperty('--pzq',q.toFixed(4)); }
  window.addEventListener('scroll',function(){ if(!tick){ tick=true; requestAnimationFrame(run); } },{passive:true});
  window.addEventListener('resize',run); run();
})();

/* Pump 분해도: 화면에 들어오면 부품 8층이 위에서부터 차례로 자동 재생(전체 1.3초, 1회).
   각 층·표시(A~D)는 --v(0~1)로 나타남 정도를 받음. A~D는 자기 부품이 나온 직후 따라붙음 */
(function(){
  var pin=document.querySelector('.px-pin'); if(!pin) return;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lys=[].slice.call(pin.querySelectorAll('.px-ly')), dots=[].slice.call(pin.querySelectorAll('.px-fig .px-dot'));
  var N=lys.length, DUR=1300, END=N+1.1;                 /* u 가 0 → END 까지 DUR(ms) 동안 진행 */
  function ease(x){ x=Math.max(0,Math.min(1,x)); return 1-Math.pow(1-x,3); }
  function back(x){ x=Math.max(0,Math.min(1,x)); var c=1.9; return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2); }   /* 살짝 넘쳤다 붙는 느낌 */
  function draw(u){
    lys.forEach(function(e,i){ e.style.setProperty('--v',ease((u-i)/2).toFixed(3)); });
    dots.forEach(function(e,k){ var i=+e.getAttribute('data-i')-1, same=dots.filter(function(d,n){return n<k&&d.getAttribute('data-i')===e.getAttribute('data-i');}).length;
      var v=back((u-i-.4-same*.5)/1.2); e.style.setProperty('--v',Math.max(0,v).toFixed(3)); e.style.pointerEvents=v>.6?'auto':'none'; });
  }
  if(!reduce && 'IntersectionObserver' in window){
    draw(0);
    var io=new IntersectionObserver(function(es){ if(!es[0].isIntersecting) return; io.disconnect();
      var t0=performance.now(); (function step(now){ var p=Math.min(1,(now-t0)/DUR); draw(p*END); if(p<1) requestAnimationFrame(step); else draw(END+2); })(t0);
    },{threshold:.45});
    io.observe(pin.querySelector('.px-fig'));
  }
  var items=dots.concat([].slice.call(document.querySelectorAll('.px-row')));
  function on(k){ items.forEach(function(e){ e.classList.toggle('is-on', !!k && e.getAttribute('data-k')===k); }); }
  items.forEach(function(e){ var k=e.getAttribute('data-k');
    e.addEventListener('pointerenter',function(ev){ if(ev.pointerType==='mouse') on(k); });
    e.addEventListener('pointerleave',function(ev){ if(ev.pointerType==='mouse') on(''); });
    if(e.tagName==='BUTTON'){ e.addEventListener('focus',function(){ on(k); }); e.addEventListener('blur',function(){ on(''); });
      e.addEventListener('click',function(){ var row=document.querySelector('.px-row[data-k="'+k+'"]'); on(k); if(row) row.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'}); }); }
  });
})();

/* Pump Line up: 끌어서 옆으로 넘김.
   - 카드 줄: 마우스로 잡아 끌기(터치는 기본 밀기), 키보드 ← →
   - 눈금의 손잡이: 끌면 그 비율만큼 카드 줄이 이동. 줄이 움직이면 손잡이도 따라감 */
(function(){
  var pin=document.querySelector('.mx-pin'); if(!pin) return;
  var view=pin.querySelector('.mx-view'), ruler=pin.querySelector('.mx-ruler'), pill=pin.querySelector('.mx-pill');
  function max(){ return Math.max(1,view.scrollWidth-view.clientWidth); }
  function sync(){ if(view.scrollLeft>4) pill.classList.remove('is-hint'); var p=Math.max(0,Math.min(1,view.scrollLeft/max())); pin.style.setProperty('--mxp',p.toFixed(4)); pill.setAttribute('aria-valuenow',Math.round(p*100)); }
  function used(){ pill.classList.remove('is-hint'); }
  view.addEventListener('scroll',sync,{passive:true}); window.addEventListener('resize',sync); window.addEventListener('load',sync); sync();
  /* 카드 줄 끌기(마우스) */
  var d=null;
  view.addEventListener('pointerdown',function(e){ if(e.pointerType!=='mouse'||e.button!==0) return; d={x:e.clientX,l:view.scrollLeft,moved:false}; view.setPointerCapture(e.pointerId); view.classList.add('is-drag'); });
  view.addEventListener('pointermove',function(e){ if(!d) return; var dx=e.clientX-d.x; if(Math.abs(dx)>3){ d.moved=true; used(); } view.scrollLeft=d.l-dx; });
  function end(e){ if(!d) return; d=null; view.classList.remove('is-drag'); try{ view.releasePointerCapture(e.pointerId); }catch(_){} }
  view.addEventListener('pointerup',end); view.addEventListener('pointercancel',end);
  view.addEventListener('touchstart',used,{passive:true});
  /* 손잡이 끌기(마우스·터치 공통) */
  var h=null;
  function toP(e){ var r=ruler.getBoundingClientRect(), w=pill.offsetWidth; return Math.max(0,Math.min(1,(e.clientX-r.left-h.off)/Math.max(1,r.width-w))); }
  pill.addEventListener('pointerdown',function(e){ var b=pill.getBoundingClientRect(); h={off:e.clientX-b.left}; pill.setPointerCapture(e.pointerId); pill.classList.add('is-drag'); used(); e.preventDefault(); });
  pill.addEventListener('pointermove',function(e){ if(!h) return; view.scrollLeft=toP(e)*max(); });
  function hend(e){ if(!h) return; h=null; pill.classList.remove('is-drag'); try{ pill.releasePointerCapture(e.pointerId); }catch(_){} }
  pill.addEventListener('pointerup',hend); pill.addEventListener('pointercancel',hend);
  pill.addEventListener('keydown',function(e){ var s=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0; if(!s) return; e.preventDefault(); used(); view.scrollBy({left:s*view.clientWidth*.5,behavior:'smooth'}); });
  /* 눈금을 누르면 그 위치로 */
  ruler.addEventListener('pointerdown',function(e){ if(e.target!==ruler) return; used(); var r=ruler.getBoundingClientRect(), w=pill.offsetWidth; view.scrollTo({left:Math.max(0,Math.min(1,(e.clientX-r.left-w/2)/Math.max(1,r.width-w)))*max(),behavior:'smooth'}); });
})();

/* Conc. Meter 제품 장면: 화면에 들어오면 제품이 떠오르고(이후 천천히 오르내림) A~D가 차례로 붙음.
   A~D와 Features 줄은 서로 강조가 연결되고, A~D를 누르면 해당 줄로 이동 */
(function(){
  var top=document.querySelector('.cx-top'); if(!top) return;
  var fig=top.querySelector('.cx-fig'), reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduce && 'IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){ if(!es[0].isIntersecting) return; io.disconnect(); top.classList.add('is-in'); },{threshold:.4});
    io.observe(fig);
  } else top.classList.add('is-in');
  var items=[].slice.call(fig.querySelectorAll('.px-dot')).concat([].slice.call(document.querySelectorAll('.px-row[data-k]')));
  function on(k){ items.forEach(function(e){ e.classList.toggle('is-on', !!k && e.getAttribute('data-k')===k); }); }
  items.forEach(function(e){ var k=e.getAttribute('data-k');
    e.addEventListener('pointerenter',function(ev){ if(ev.pointerType==='mouse') on(k); });
    e.addEventListener('pointerleave',function(ev){ if(ev.pointerType==='mouse') on(''); });
    if(e.tagName==='BUTTON'){ e.addEventListener('focus',function(){ on(k); }); e.addEventListener('blur',function(){ on(''); });
      e.addEventListener('click',function(){ var row=document.querySelector('.px-row[data-k="'+k+'"]'); on(k); if(row) row.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'}); }); }
  });
})();
