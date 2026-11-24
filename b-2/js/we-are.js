/* We are / History — we-are-white.html 의 initWeAre() 원본 그대로.
   자체 scroll 리스너만 쓰고 #weare(.hwrap) 기준 위치로 계산하므로 site.js 의 인트로·메뉴 처리와 독립적으로 동작. */
function initWeAre(){
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 연혁 이미지 호버: 확장이 왼쪽 칼럼을 침범하는 만큼 이전 칼럼들을 좌측으로 슬라이드
  var cardsAll=[].slice.call(document.querySelectorAll('#track .hcard'));
  cardsAll.forEach(function(card,idx){
    var ph2=card.querySelector('.ph'); if(!ph2) return;
    ph2.addEventListener('pointerenter', function(){
      var padL=parseFloat(getComputedStyle(card.parentElement).paddingLeft)||0;
      var contentW=card.clientWidth-28;
      var expW=(ph2.offsetHeight+174)*1.78;
      var dx=Math.min(Math.max(expW-contentW,0)+14, padL-6);
      if(dx<=14) return;
      for(var i=0;i<idx;i++){ cardsAll[i].style.transform='translateX(-'+dx.toFixed(1)+'px)'; }
    });
    ph2.addEventListener('pointerleave', function(){
      for(var i=0;i<idx;i++){ cardsAll[i].style.transform=''; }
    });
  });
  // history horizontal pin (세로 스크롤 → 가로 translate 스크럽)
  var hwrap = document.querySelector('.hwrap');
  var track = document.getElementById('track');
  var hbar = document.getElementById('hbar');
  var cards = track.querySelectorAll('.hcard');
  function onScroll(){
    if(reduced) return;
    var rect = hwrap.getBoundingClientRect();
    var total = hwrap.offsetHeight - window.innerHeight;
    if(total <= 0) return;
    var p = Math.min(1, Math.max(0, -rect.top / total));
    var max = track.scrollWidth - track.parentElement.clientWidth;
    track.style.transform = 'translateX(' + (-p * max) + 'px)';
    if(hbar) hbar.style.width = (p*100) + '%';
    var idx = Math.min(cards.length-1, Math.floor(p * cards.length));
    cards.forEach(function(c,i){ c.classList.toggle('on', i<=idx); });
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll);
  onScroll();
}
if (document.querySelector('.hwrap') && document.getElementById('track')) initWeAre();
