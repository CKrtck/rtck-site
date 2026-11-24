/* 04 Partners — 로고 칸 호버/포커스/탭으로 협업 내용 표시 + RTCK 심볼 커서
   (등장 시점은 we-are.js가 .hr.is-d 로 제어) */
(function(){
  var box=document.getElementById('partnership');
  if(!box) return;
  var cells=[].slice.call(box.querySelectorAll('.hr-cell'));
  var cur=box.querySelector('.hr-cur');
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine=matchMedia('(hover: hover) and (pointer: fine)').matches;
  var act=null;

  // 등장 시차 순서: 윗줄 → 아랫줄 좌→우
  [].slice.call(box.querySelectorAll('.hr-row li')).forEach(function(li,i){ li.style.setProperty('--k',i); });
  if(reduce) return;

  // 활성 칸 설정 (null = 해제)
  function set(c){
    if(act===c) return;
    if(act) act.classList.remove('is-act');
    act=c;
    if(c) c.classList.add('is-act');
    box.classList.toggle('has-act',!!c);
    if(cur) cur.dataset.big=c?'1':'';
  }

  // 포인터로 누른 직후의 focus는 무시(탭 토글과 충돌 방지) — 키보드 포커스만 반영
  var pressed=false;
  box.addEventListener('pointerdown',function(){ pressed=true; setTimeout(function(){ pressed=false; },400); },{passive:true});
  cells.forEach(function(c){
    c.addEventListener('focus',function(){ if(!pressed) set(c); });
    c.addEventListener('blur',function(){ if(act===c) set(null); });
    if(fine){
      c.addEventListener('mouseenter',function(){ set(c); });
      c.addEventListener('mouseleave',function(){ if(act===c&&document.activeElement!==c) set(null); else if(act===c) c.blur(); });
    }else{
      // 터치: 탭으로 토글(한 번에 하나)
      c.addEventListener('click',function(e){ e.preventDefault(); set(act===c?null:c); });
    }
  });
  if(!fine){
    document.addEventListener('click',function(e){ if(act&&!box.contains(e.target)) set(null); },{passive:true});
    return;
  }

  // RTCK 심볼 커서: 지연·자석 효과 없이 포인터 위치를 그대로 따라감
  if(!cur) return;
  function place(e){ cur.style.transform='translate('+e.clientX+'px,'+e.clientY+'px) translate(-50%,-50%)'; }
  box.addEventListener('pointerenter',function(e){
    if(e.pointerType!=='mouse') return;
    place(e); box.classList.add('is-cur');
  });
  box.addEventListener('pointermove',function(e){ if(e.pointerType==='mouse') place(e); },{passive:true});
  box.addEventListener('pointerleave',function(){ box.classList.remove('is-cur'); });
})();
