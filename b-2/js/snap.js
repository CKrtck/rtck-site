/* 반자동 스크롤 (전 페이지 공용)
   - 대상: main 바로 아래 섹션들 + 하단 footer. 두 섹션의 경계가 화면 안에 걸쳐 멈추면,
     스크롤하던 방향으로 조금(화면 높이의 5%)만 넘어가도 다음 섹션이 화면 위쪽에 맞춰 자리 잡음.
   - 화면 고정 연출 구간(인트로·We are·파트너십·HCR 360)이나 화면보다 긴 섹션의 안쪽에서는 개입하지 않음
     → 연출이 끝나 다음 섹션이 보이기 시작할 때만 동작.
   - 팝업·모바일 메뉴가 열려 있거나, 모션 줄이기 설정이면 동작하지 않음. */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var root = document.documentElement;
  var secs = [].slice.call(document.querySelectorAll('main > section, main > div, body > footer')).filter(function (e) { return e.offsetHeight > 40; });
  if (secs.length < 2) return;
  var lastY = window.scrollY, dir = 0, timer = null, auto = false, autoT = null, touching = false, target = null;

  function blocked() {
    return root.classList.contains('ctlock') || root.classList.contains('is-leaving') || !!document.querySelector('.nav.is-open');
  }
  function settle() {
    if (auto || touching || blocked() || !dir) return;
    var y = window.scrollY, vh = window.innerHeight, max = root.scrollHeight - vh;
    for (var i = 1; i < secs.length; i++) {
      var T = Math.round(secs[i].getBoundingClientRect().top + y);           /* 다음 섹션의 위쪽 = 경계 */
      var P = secs[i - 1], pTop = Math.round((getComputedStyle(P).position === 'sticky' ? P.parentElement : P).getBoundingClientRect().top + y);  /* 화면에 붙는(sticky) 장면은 원래 자리 기준 */
      var up = Math.max(pTop, T - vh), down = Math.min(T, max);              /* 위쪽·아래쪽 정착 위치 */
      if (down - up < 24 || y <= up + 1 || y >= down - 1) continue;          /* 경계가 화면에 걸쳐 있지 않음 */
      var f = (y - up) / (down - up), to;
      if (dir > 0) to = f > 0.05 ? down : up; else to = f < 0.95 ? up : down;
      go(to); return;
    }
  }
  function go(to) {
    if (Math.abs(to - window.scrollY) < 2) return;
    auto = true; target = to; clearTimeout(autoT);
    window.scrollTo({ top: to, behavior: 'smooth' });
    autoT = setTimeout(function () { auto = false; }, 1400);
  }
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    if (auto) { if (Math.abs(y - target) < 2) { auto = false; clearTimeout(autoT); } lastY = y; return; }
    if (y !== lastY) dir = y > lastY ? 1 : -1;
    lastY = y; clearTimeout(timer); timer = setTimeout(settle, 140);
  }, { passive: true });
  /* 자동 이동 중에 사용자가 다시 스크롤하면 사용자 조작을 우선 */
  ['wheel', 'touchstart', 'keydown'].forEach(function (t) {
    window.addEventListener(t, function () { if (auto) { auto = false; clearTimeout(autoT); } if (t === 'touchstart') touching = true; }, { passive: true });
  });
  ['touchend', 'touchcancel'].forEach(function (t) {
    window.addEventListener(t, function () { touching = false; clearTimeout(timer); timer = setTimeout(settle, 220); }, { passive: true });
  });
})();
