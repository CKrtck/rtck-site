/* WHY RTCK — 100svh 스테이지: 섹션이 충분히 보이면 인트로 자동 재생(낙하 → 크게 → 대기 상태),
   판 3장(FAB 3개 층)은 감쇠 스프링으로 목표를 따라감. 판 호버(탭·포커스) = 해당 층 열기.
   유지: 스크롤 속도 임펄스 · 마우스 패럴랙스/밀어내기 · 클릭 튕김 · 층 구조물 · 층간 배기 흐름 */
(function () {
  var sec = document.getElementById('why'); if (!sec) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var narrowQ = window.matchMedia('(max-width:720px),(max-aspect-ratio:4/5)');

  var stage = sec.querySelector('.why__stage'), base = sec.querySelector('.why__base'), wrap = sec.querySelector('.why__plates');
  var head = sec.querySelector('.why__top'), title = sec.querySelector('.why__title'), list = sec.querySelector('.why__floors');
  var F = [3, 2, 1];                                   /* 배열 순서: 0=3F, 1=2F, 2=1F */
  var plates = F.map(function (f) { return sec.querySelector('.why__plate[data-f="' + f + '"]'); });
  var rhs = plates.map(function (p) { return p.querySelector('.why__rh'); });
  var gs = plates.map(function (p) { return p.querySelector('.why__g'); });
  var floors = F.map(function (f) { return sec.querySelector('.why__floor[data-f="' + f + '"]'); });
  var labels = floors.map(function (li) { return li.querySelector('.why__label'); });
  var linkA = sec.querySelector('.why__links[data-l="2"]'), linkB = sec.querySelector('.why__links[data-l="1"]');  /* A: 3F→2F, B: 2F→1F */

  /* 판 좌표계(viewBox 1000×315) 위 점: a·b = 판 평면 좌표(0~1), h = 높이 */
  function P(a, b, h) { return [500 * (a + b), 157.5 + 157.5 * (b - a) - (h || 0)]; }
  var XS = [.3, .5, .7], PIPE = [.22, .42, .62];       /* 장비 열 위치 · 각 장비가 이어지는 2F 배관 */
  var SHOW_LINKS = false;                              /* 층간 연결선·흐름 점: '활성 층만 표시' 규칙과 맞지 않아 꺼 둠 (true 로 복원) */
  var HCR_TOP = 126;                                   /* HCR 가운데 아웃렛 윗면 높이 */

  var u = 1, A = 0, PW = 0, PH = 0, W = 0, VH = 0, narrow = false, headB = 0, titleB = 0, listT = 0;

  function measure() {
    PW = base.offsetWidth; PH = base.offsetHeight; u = PW / 64.8;
    A = base.offsetTop; W = stage.offsetWidth; VH = stage.offsetHeight; narrow = narrowQ.matches;
    headB = head.offsetTop + head.offsetHeight; titleB = title.offsetTop + title.offsetHeight; listT = list.offsetTop;
    /* 네 꼭짓점 라운드: 꼭짓점에서 잘라내는 길이를 화면 기준 약 14px 로 통일 (예각·둔각 모두 둥글게 보이도록) */
    var k = 1000 / Math.max(1, PW), t = 14 * k / 524;
    var V = [[2, 157.5], [500, 2], [998, 157.5], [500, 313]], path = '';
    for (var i = 0; i < 4; i++) {
      var p = V[(i + 3) % 4], c = V[i], n = V[(i + 1) % 4];
      var a1 = [c[0] + (p[0] - c[0]) * t, c[1] + (p[1] - c[1]) * t], a2 = [c[0] + (n[0] - c[0]) * t, c[1] + (n[1] - c[1]) * t];
      path += (i ? 'L' : 'M') + a1[0].toFixed(1) + ' ' + a1[1].toFixed(1) + 'Q' + c[0] + ' ' + c[1] + ' ' + a2[0].toFixed(1) + ' ' + a2[1].toFixed(1);
    }
    path += 'Z'; rhs.forEach(function (el) { el.setAttribute('d', path); });
    wrap.classList.toggle('no-tag', PW < 560);         /* 태그는 판과 함께 커지고 줄어듦 → 작은 판에서는 숨김 */
  }

  /* 층간 연결선: 각 판의 실제 위치(rect)로 계산 */
  var NS = 'http://www.w3.org/2000/svg', segA = [], segB = [], dots = [];
  function mk(par, tag) { var e = document.createElementNS(NS, tag); par.appendChild(e); return e; }
  XS.forEach(function (x, j) {
    segA.push(mk(linkA, 'line')); segB.push(mk(linkB, 'line'));
    for (var q = 0; q < 2; q++) { var c1 = mk(linkA, 'circle'), c2 = mk(linkB, 'circle'); c1.setAttribute('r', 2.6); c2.setAttribute('r', 2.6); dots.push({ j: j, o: q / 2 + j * .13, a: c1, b: c2 }); }
  });
  var pts = [];
  function linkGeom() {
    var wr = wrap.getBoundingClientRect(), R = plates.map(function (p) { return p.getBoundingClientRect(); });
    function at(i, a, b, h) { var r = R[i], k = r.width / 1000, q = P(a, b, h); return [r.left - wr.left + q[0] * k, r.top - wr.top + q[1] * k]; }
    pts = XS.map(function (x, j) { var b = PIPE[j]; return [at(0, x - .08, x + .08, 0), at(1, 2 * x - b, b, 6), at(2, x, x, HCR_TOP)]; });
    pts.forEach(function (p, j) {
      segA[j].setAttribute('x1', p[0][0]); segA[j].setAttribute('y1', p[0][1]); segA[j].setAttribute('x2', p[1][0]); segA[j].setAttribute('y2', p[1][1]);
      segB[j].setAttribute('x1', p[1][0]); segB[j].setAttribute('y1', p[1][1]); segB[j].setAttribute('x2', p[2][0]); segB[j].setAttribute('y2', p[2][1]);
    });
  }
  function flow(t) {                                   /* 점이 위 → 아래로 흐름 */
    dots.forEach(function (d) {
      var p = pts[d.j]; if (!p) return;
      var la = p[1][1] - p[0][1], lb = p[2][1] - p[1][1], tot = Math.max(1, la + lb), s = ((t / 2600 + d.o) % 1) * tot;
      var inA = s < la, y = inA ? p[0][1] + s : p[1][1] + (s - la);
      d.a.style.display = inA ? '' : 'none'; d.b.style.display = inA ? 'none' : '';
      var c = inA ? d.a : d.b; c.setAttribute('cx', p[0][0]); c.setAttribute('cy', y.toFixed(1));
    });
  }

  if (reduce) {                                        /* 정적 상태: 판 위치는 CSS, 연결선만 계산 */
    if (!SHOW_LINKS) [linkA, linkB].forEach(function (l) { l.style.display = 'none'; });
    var still = function () { measure(); linkGeom(); dots.forEach(function (d) { d.a.style.display = d.b.style.display = 'none'; }); };
    still(); window.addEventListener('resize', still); return;
  }

  /* 층 배치(3F 중심 기준 각 판 중심 간격, 단위 = 판 폭) */
  var IDLE = [0, .18, .39];
  var OPEN = { 3: [0, .52, .76], 2: [0, .45, .69], 1: [0, .18, .68] };
  var O = [-9.1, -4.3, 1.2];                           /* CSS 기본 자리(단위 u) */
  var K = [165, 190, 215], C = [12.5, 15, 17.5];      /* 판마다 다른 강성·감쇠 → 시차 */
  var SENS = [1, .7, .45], AMP = [2.5, 1.75, 1];       /* 스크롤 민감도 · 마우스 패럴랙스 폭(u) */
  var NEED = [0, .25, .3];                             /* 구조물이 보이려면 필요한 위 판과의 간격(판 폭 대비) */
  var OBJ = .075;                                      /* 3F 장비가 판 위로 솟는 높이(판 폭 대비) */

  var y = [0, 0, 0], v = [0, 0, 0], phase = ['park', 'park', 'park'], s = 1, shown = [false, false, false];
  var open = 0, ready = false, t0 = 0, mouse = null, mouseF = 0, leaveAt = 0, kbF = 0, tapF = 0;
  var running = false, raf = 0, lastT = 0, lastY = window.scrollY;

  function cl(x, a, b) { return x < a ? a : x > b ? b : x; }
  function ease(t) { t = cl(t, 0, 1); return t * t * (3 - 2 * t); }
  function sc(i) { return A + O[i] * u; }              /* CSS 기본 중심(px) */
  function liveCy(i) { return sc(i) + y[i]; }

  /* 배치 → 판 중심(px): 헤더(좁은 화면 대기 상태는 타이틀) 아래 ~ 화면 하단(좁은 화면은 층 정보 위) 안에 맞춤 */
  function place(offs, f) {
    var top0 = (narrow && !f ? titleB : headB) + VH * .03, bot0 = narrow ? listT - VH * .03 : VH * .97;
    var obj = f ? OBJ * PW : 0, span = offs[2] * PW, room = bot0 - top0 - PH - obj, k = span > room ? Math.max(.3, room / span) : 1;
    var mid = narrow ? (top0 + obj + bot0) / 2 : VH * .58;
    var c3 = mid - span * k / 2;
    c3 = Math.min(c3, bot0 - PH / 2 - span * k); c3 = Math.max(c3, top0 + obj + PH / 2);
    return offs.map(function (o) { return c3 + o * PW * k; });
  }

  /* 열린 층 표시: 섹션 속성 · 층 정보 · 정보 세로 위치(넓은 화면은 열린 판 높이에) */
  function setOpen(f) {
    if (f === open) return;
    open = f; sec.setAttribute('data-open', f);
    floors.forEach(function (li, i) { var a = F[i] === f; li.classList.toggle('is-on', a); labels[i].setAttribute('aria-expanded', a ? 'true' : 'false'); });
  }

  /* 호버 판정: 대기 배치 기준 가로 띠(3F·2F·1F) + 스택 기둥 영역. 띠 경계는 대기 중심의 중간점 → 판이 움직여도 깜빡이지 않음 */
  function floorAt(m) {
    if (Math.abs(m.x - W / 2) > PW * s / 2 * 1.04) return 0;
    var I = place(IDLE, 0), top = Math.min(I[0], liveCy(0)) - PH / 2 - OBJ * PW, bot = Math.max(I[2], liveCy(2)) + PH / 2;
    if (m.y < top || m.y > bot) return 0;
    return m.y < (I[0] + I[1]) / 2 ? 3 : m.y < (I[1] + I[2]) / 2 ? 2 : 1;
  }

  function tick(t) {
    raf = 0; if (!running) return;
    var dt = lastT ? Math.min((t - lastT) / 1000, 1 / 30) : 1 / 60; lastT = t;
    var r = sec.getBoundingClientRect(), wh = window.innerHeight;

    /* 인트로 자동 재생: 섹션이 60% 이상 보이면 1회 */
    if (!t0 && (Math.min(r.bottom, wh) - Math.max(r.top, 0)) / r.height >= .6) t0 = t;
    var it = t0 ? t - t0 : -1;
    if (!ready && it > 1900) { ready = true; sec.classList.add('is-ready'); }

    /* 열린 층: 키보드 > 탭 > 마우스 (마우스가 스택을 벗어나도 150ms 유지) */
    if (mouse) { var mf = floorAt(mouse); if (mf) { mouseF = mf; leaveAt = 0; } else if (mouseF) { if (!leaveAt) leaveAt = t; if (t - leaveAt > 150) mouseF = 0; } }
    setOpen(ready ? (kbF || tapF || mouseF) : 0);

    /* 목표 중심 */
    var tc = place(open ? OPEN[open] : IDLE, open), sT = 1;
    if (!ready && it >= 0) {                           /* 크게 보이다가 줄어들며 자리 잡음 */
      var s0 = Math.min(1.72, .96 * W / PW), e = ease((it - 800) / 1000), mid = (tc[0] + tc[2]) / 2;
      sT = s0 + (1 - s0) * e;
      tc = tc.map(function (c) { var big = mid + VH * .12 + (c - mid) * s0; return big + (c - big) * e; });
    }
    /* 우측 문구: 블록 세로 중앙 = 열린 판의 목표 중심선 (헤더·화면 하단과 겹칠 때만 클램프) */
    if (open && !narrow) {
      var bh = floors[F.indexOf(open)].offsetHeight, m = VH * .02;
      list.style.setProperty('--iy', cl(tc[F.indexOf(open)], headB + m + bh / 2, VH - m - bh / 2).toFixed(1) + 'px');
    }
    s += (sT - s) * Math.min(1, dt * 14);
    rhs[0].style.strokeWidth = (2.5 / s).toFixed(3);

    var dy = cl(window.scrollY - lastY, -70, 70); lastY = window.scrollY;   /* 스크롤 속도 임펄스 */

    for (var i = 0; i < 3; i++) {
      var T = tc[i] - sc(i);
      if (mouse && ready) {
        if (!open) T += cl((mouse.y - VH / 2) / (VH / 2), -1, 1) * AMP[i] * u;                    /* 패럴랙스 */
        var cy = liveCy(i), d = Math.abs(mouse.x - W / 2) / (PW * s / 2 * 1.08) + Math.abs(mouse.y - cy) / (PH * s / 2 * 1.9);
        if (d < 1 && !open) T += (cy >= mouse.y ? 1 : -1) * (1 - d) * 3.2 * u;                  /* 가까이 지나가면 밀려남 (대기 상태만) */
      }
      if (phase[i] === 'park') {
        y[i] = -sc(i) - PH * 1.2 - 40; v[i] = 0;
        if (t0 && it >= (2 - i) * 120) { phase[i] = 'fall'; v[i] = 250; }                         /* 1F → 2F → 3F 순 낙하 */
      } else if (phase[i] === 'fall') {
        v[i] += 4200 * dt; y[i] += v[i] * dt;
        if (y[i] >= T) { y[i] = T; v[i] *= .38; phase[i] = 'spring'; }                            /* 착지 → 스프링 바운스 */
      } else {
        v[i] -= dy * SENS[i] * 7;
        v[i] += (K[i] * (T - y[i]) - C[i] * v[i]) * dt;
        v[i] = cl(v[i], -1700, 1700);
        y[i] += v[i] * dt;
      }
      plates[i].style.transform = 'translate3d(0,' + y[i].toFixed(2) + 'px,0) scale(' + s.toFixed(4) + ')';
    }

    /* 구조물: 열린 층에만, 위 판과의 간격이 충분할 때 */
    for (i = 0; i < 3; i++) {
      var gap = i ? (liveCy(i) - liveCy(i - 1)) / PW : 1;
      shown[i] = open === F[i] && (shown[i] ? gap > NEED[i] * .85 : gap > NEED[i]);
      gs[i].classList.toggle('is-on', shown[i]);
    }
    if (SHOW_LINKS) {
      linkA.classList.toggle('is-on', shown[0] && shown[1] && (liveCy(1) - liveCy(0)) / PW > .2);
      linkB.classList.toggle('is-on', shown[1] && shown[2] && (liveCy(2) - liveCy(1)) / PW > .2);
      linkGeom(); flow(t);
    }
    raf = requestAnimationFrame(tick);
  }
  function start() { if (running) return; running = true; lastT = 0; lastY = window.scrollY; measure(); raf = requestAnimationFrame(tick); }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

  /* 화면에 있을 때만 루프 */
  new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) start(); else stop(); }); }).observe(sec);
  window.addEventListener('resize', measure);
  /* 첫 표시 전에 판을 화면 위쪽으로 치워 둠 */
  measure(); plates.forEach(function (pl, i) { y[i] = -sc(i) - PH * 1.2 - 40; pl.style.transform = 'translate3d(0,' + y[i] + 'px,0)'; });

  /* 마우스만 패럴랙스·호버, 터치는 탭(튕김 + 층 열기/닫기) */
  function local(e) { var r = stage.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  stage.addEventListener('pointermove', function (e) { mouse = e.pointerType === 'mouse' ? local(e) : null; }, { passive: true });
  stage.addEventListener('pointerleave', function () { mouse = null; mouseF = 0; }, { passive: true });
  stage.addEventListener('pointerdown', function (e) {
    var m = local(e), pl = e.target.closest && e.target.closest('.why__plate'), i = -1;
    if (pl) i = F.indexOf(+pl.getAttribute('data-f'));
    else for (var j = 0; j < 3 && i < 0; j++) if (Math.abs(m.x - W / 2) / (PW * s / 2) + Math.abs(m.y - liveCy(j)) / (PH * s / 2) <= 1) i = j;
    if (i > -1 && phase[i] === 'spring') v[i] -= 760;                                        /* 통 튀기 (구조물 포함) */
    if (e.pointerType !== 'mouse' && ready && !e.target.closest('a,button')) {
      var f = floorAt(m); tapF = f && f !== tapF ? f : 0;                                    /* 같은 판 또는 바깥 탭 = 대기 */
    }
  }, { passive: true });

  /* 키보드: 층 버튼 포커스 → 해당 층 열기 */
  labels.forEach(function (b, i) {
    b.addEventListener('focus', function () { if (b.matches(':focus-visible')) kbF = F[i]; });
    b.addEventListener('blur', function () { if (kbF === F[i]) kbF = 0; });
    b.addEventListener('click', function () { tapF = tapF === F[i] ? 0 : F[i]; });
  });
  sec.addEventListener('keydown', function (e) { if (e.key === 'Escape') { kbF = tapF = 0; if (document.activeElement) document.activeElement.blur(); } });
})();
