/* PARTNERSHIP — 터치에서는 탭으로 로고 카드를 뒤집고, 슬로건은 스크롤에 따라 대괄호 안에서 롤링 */
(function () {
  var sec = document.getElementById('partnership'); if (!sec) return;
  var last = 'mouse';
  sec.addEventListener('pointerdown', function (e) { last = e.pointerType || 'mouse'; }, true);
  [].forEach.call(sec.querySelectorAll('.ps-flip'), function (b) {
    b.addEventListener('click', function () {
      if (last === 'mouse') return;
      var on = !b.classList.contains('is-flipped');
      [].forEach.call(sec.querySelectorAll('.ps-flip.is-flipped'), function (o) { o.classList.remove('is-flipped'); });
      b.classList.toggle('is-flipped', on); if (!on) b.blur();
    });
  });
  /* 슬로건 롤링: 섹션이 화면에 고정된 동안의 스크롤 진행도를 3구간으로 나눠 항목 전환 (대괄호는 고정) */
  var vals = [].slice.call(sec.querySelectorAll('.ps-val')), roll = sec.querySelector('.ps-roll'), cur = -1, tick = false;
  function frame() {
    tick = false;
    var total = sec.offsetHeight - window.innerHeight; if (total <= 0) return;
    var p = Math.min(1, Math.max(0, -sec.getBoundingClientRect().top / total));
    var i = Math.min(vals.length - 1, Math.floor(p * vals.length));
    if (i === cur) return; cur = i;
    roll.style.setProperty('--i', i);
    vals.forEach(function (v, k) { v.classList.toggle('is-active', k === i); });
  }
  function onScroll() { if (!tick) { tick = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  frame();
})();
