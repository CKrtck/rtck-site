/* HCR 페이지 — 360° 안내를 잠시 보여준 뒤 걷어내고, 화면 고정 구간의 스크롤 진행도로 특장점을 하나씩 펼침 */
(function () {
  var root = document.documentElement, sec = document.querySelector('.hx'); if (!sec) return;
  var feats = [].slice.call(sec.querySelectorAll('.hx-feat')), cur = -1, tick = false;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function open() { root.classList.remove('is-veiled'); }
  var timer = setTimeout(open, reduce ? 300 : 1700);
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (t) {
    window.addEventListener(t, function () { clearTimeout(timer); open(); }, { passive: true, once: true });
  });
  function frame() {
    tick = false;
    var total = sec.offsetHeight - window.innerHeight; if (total <= 0) return;
    var p = Math.min(1, Math.max(0, -sec.getBoundingClientRect().top / total));
    var step = p < 0.1 ? 0 : 1 + Math.min(feats.length - 1, Math.floor((p - 0.1) / 0.9 * feats.length));
    if (step === cur) return; cur = step;
    sec.setAttribute('data-step', step);
    feats.forEach(function (f, i) { f.classList.toggle('is-active', i === step - 1); });
  }
  function onScroll() { if (!tick) { tick = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  frame();
})();
