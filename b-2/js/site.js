/* 메뉴로 페이지를 옮기면 항상 그 페이지 맨 위에서 시작 (브라우저의 "마지막 위치 복원" 끔).
   주소에 #섹션 이 붙은 이동(About us·Contact 등)은 해당 섹션으로 감. */
(function(){
  try{ if('scrollRestoration' in history) history.scrollRestoration='manual'; }catch(e){}
  function top(){ if(!location.hash){ var r=document.documentElement, o=r.style.scrollBehavior; r.style.scrollBehavior='auto'; window.scrollTo(0,0); r.style.scrollBehavior=o; } }
  top();
  window.addEventListener('pageshow',top);
})();
/* RTCK Concept B — 인터랙션 (라이브러리 없음, 모든 페이지 공통) */
(function () {
  var d = document, root = d.documentElement;
  root.classList.remove('no-js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nav = d.querySelector('.nav');

  /* 1. 첫 화면 등장 (페이지당 1회) */
  requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('is-ready'); }); });

  /* 2. 스크롤 텍스트 등장 */
  var rv = [].slice.call(d.querySelectorAll('.rv'));
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add('is-in'); }); }

  /* 3. 모바일 메뉴 */
  var toggle = d.querySelector('.nav__toggle');
  function closeMenu() { if (!nav) return; nav.classList.remove('is-open'); if (toggle) toggle.setAttribute('aria-expanded', 'false'); d.body.style.overflow = ''; }
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      d.body.style.overflow = open ? 'hidden' : '';
    });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    [].forEach.call(d.querySelectorAll('.nav__links a'), function (a) { a.addEventListener('click', closeMenu); });
  }


  /* 0. 인트로 고정 장면 (v2): 스크롤 진행도 → 프레임 축소 · 제품 정지 */
  var intro = d.querySelector('.intro'), stage = intro && intro.querySelector('.intro__stage'), prod = intro && intro.querySelector('.intro__prod');
  var introP = 0, fab = d.querySelector('.fab'), dock = d.querySelector('.why__btn');
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  var prodF = intro && intro.querySelector('.intro__prod--front'), leaving = false;
  function introFrame() {
    if (!intro || leaving) return;
    var vh = stage.offsetHeight, vw = stage.offsetWidth;
    var p = cl(-intro.getBoundingClientRect().top / Math.max(1, intro.offsetHeight - vh));
    var t = cl((p - 0.06) / 0.72), e = t * t * (3 - 2 * t);
    introP = p;
    stage.style.setProperty('--p', e.toFixed(4));
    stage.style.setProperty('--o', (1 - cl(p / 0.2)).toFixed(3));
    if (fab) { fab.style.setProperty('--p', e.toFixed(4)); fab.style.setProperty('--m', Math.min(1, Math.abs(2 * e - 1) * 1.6).toFixed(3)); }
    stage.style.setProperty('--m', Math.min(1, Math.abs(2 * e - 1) * 1.6).toFixed(3));
    stage.style.setProperty('--n', cl((p - 0.6) / 0.18).toFixed(3));
    stage.style.setProperty('--s', cl((p - 0.76) / 0.16).toFixed(3));
    var small = vw <= 720, bw = prod.offsetWidth, bh = prod.offsetHeight;
    var s0 = ((small ? 0.9 : 0.63) * vw) / bw;
    var ty0 = (small ? 0.6 : 0.675) * vh + bh * s0 / 2 - vh / 2;
    var tf = 'translate(-50%,-50%) translate3d(0,' + (ty0 * (1 - e)).toFixed(1) + 'px,0) scale(' + (s0 + (1 - s0) * e).toFixed(4) + ')';
    prod.style.transform = tf; if (prodF) prodF.style.transform = tf;
    var fo = cl((e - 0.5) / 0.38); stage.style.setProperty('--f', fo.toFixed(3)); prod.style.opacity = (1 - fo).toFixed(3);
  }

  /* 0-1. HCR 로 이동: 인트로 정지 화면에서 누르면 문구가 사라지고 → 프레임이 화면 전체를 덮고 → 360° 안내 → 페이지 이동 */
  function stop(e) { e.preventDefault(); }
  function lockScroll(on) {
    ['wheel', 'touchmove'].forEach(function (t) { window[on ? 'addEventListener' : 'removeEventListener'](t, stop, { passive: false }); });
  }
  function goHcr(href) {
    leaving = true; lockScroll(true); root.classList.add('is-leaving');
    var from = parseFloat(stage.style.getPropertyValue('--p')) || 0, t0 = null, dur = reduce ? 1 : 900;
    setTimeout(function () {
      requestAnimationFrame(function step(ts) {
        if (t0 === null) t0 = ts;
        var k = Math.min(1, (ts - t0) / dur), ek = k * k * (3 - 2 * k);
        stage.style.setProperty('--p', (from * (1 - ek)).toFixed(4));
        if (k < 1) return requestAnimationFrame(step);
        root.classList.add('is-veiled');
        setTimeout(function () { window.location.href = href; }, reduce ? 50 : 750);
      });
    }, reduce ? 0 : 450);
  }
  [].forEach.call(d.querySelectorAll('a[data-hcr]'), function (a) {
    a.addEventListener('click', function (e) {
      if (!intro || leaving || e.metaKey || e.ctrlKey || e.shiftKey) return;
      var settled = intro.getBoundingClientRect().bottom > window.innerHeight - 2 && introP >= 0.6;
      if (!settled) return;                       /* 다른 위치에서는 바로 이동 */
      e.preventDefault(); goHcr(a.getAttribute('href'));
    });
  });
  window.addEventListener('pageshow', function (e) {   /* 뒤로 가기로 돌아왔을 때 원상 복구 */
    if (!leaving) return;
    leaving = false; lockScroll(false); root.classList.remove('is-leaving', 'is-veiled'); onScroll();
  });

  /* 4. 스크롤 연동: 내비 색상 전환 · 현재 메뉴 표시 · 패럴랙스 · 타임라인 */
  var themed = [].slice.call(d.querySelectorAll('[data-theme]'));
  var spy = [].slice.call(d.querySelectorAll('.nav__links a[href^="#"]')).map(function (a) {
    return { a: a, el: d.getElementById(a.getAttribute('href').slice(1)) };
  }).filter(function (x) { return x.el; });
  var pars = reduce ? [] : [].slice.call(d.querySelectorAll('[data-par]'));
  var rail = d.querySelector('.hist__rail');
  var items = [].slice.call(d.querySelectorAll('.hist__item'));
  var yearEl = d.querySelector('.hist__year');
  var yearTxt = yearEl && yearEl.querySelector('span');
  var curYear = null, swapT;

  function setYear(y) {
    if (!yearTxt || y === curYear) return;
    if (curYear === null || reduce) { yearTxt.textContent = y; curYear = y; return; }
    curYear = y; yearEl.classList.add('is-swap'); clearTimeout(swapT);
    swapT = setTimeout(function () { yearTxt.textContent = y; yearEl.classList.remove('is-swap'); }, 220);
  }

  var ticking = false, lastY = window.scrollY;
  function frame() {
    ticking = false;
    introFrame();
    /* HCR 버튼: WHY 섹션의 자리가 고정 버튼 높이까지 올라오면 그 자리로 넘겨줌(항상 1개만 표시) */
    if (fab && dock) root.classList.toggle('is-docked', dock.getBoundingClientRect().top <= fab.getBoundingClientRect().top);
    var vh = window.innerHeight, y = window.scrollY;

    if (nav) {
      /* 메뉴 표시 규칙
         - 인트로 구간: 프레임이 자리 잡은 뒤(진행도 60% 이상)에만 표시, 첫 화면에서는 항상 숨김, 배경 바 없음
         - 인트로 이후: 아래로 스크롤 → 접히며 숨김, 위로 스크롤 → 등장 */
      var inIntro = !!intro && intro.getBoundingClientRect().bottom > vh - 2;
      nav.classList.toggle('is-stuck', intro ? !inIntro : y > 24);
      if (!nav.classList.contains('is-open')) {
        if (inIntro) nav.classList.toggle('is-hidden', introP < 0.6);
        else if (y > lastY + 4 && y > 40) nav.classList.add('is-hidden');
        else if (y < lastY - 4) nav.classList.remove('is-hidden');
      }
      lastY = y;
      var probe = nav.offsetHeight / 2, theme = '';
      themed.forEach(function (s) { var r = s.getBoundingClientRect(); if (r.top <= probe && r.bottom > probe) theme = s.getAttribute('data-theme'); });
      nav.classList.toggle('on-blue', theme === 'blue');
      nav.classList.toggle('on-white', theme === 'white');
      nav.classList.toggle('on-dark', theme === 'dark');
    }

    var cur = null;
    spy.forEach(function (x) { if (x.el.getBoundingClientRect().top <= vh * 0.4) cur = x; });
    spy.forEach(function (x) { if (x === cur) x.a.setAttribute('aria-current', 'true'); else x.a.removeAttribute('aria-current'); });

    pars.forEach(function (el) {
      var host = el.closest('[data-par-host]') || el.parentElement, r = host.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var t = ((r.top + r.height / 2) - vh / 2) / vh;          /* -1 … 1 */
      var k = parseFloat(el.getAttribute('data-par')) || 0.08;
      var sc = el.hasAttribute('data-par-scale') ? 1 + Math.max(0, 0.06 - Math.abs(t) * 0.06) : 1;
      el.style.transform = 'translate3d(0,' + (t * k * -vh).toFixed(1) + 'px,0) scale(' + sc.toFixed(4) + ')';
    });

    if (rail && items.length) {
      var rr = rail.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (vh * 0.55 - rr.top) / rr.height));
      rail.style.setProperty('--p', p.toFixed(4));
      var active = items[0];
      items.forEach(function (it) { if (it.getBoundingClientRect().top <= vh * 0.6) active = it; });
      items.forEach(function (it) { it.classList.toggle('is-active', it === active); });
      setYear(active.getAttribute('data-year'));
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  frame();
})();
