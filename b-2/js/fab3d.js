/* WHY RTCK — FAB 층위 구조 3D (Three.js)
   위에서 아래로: Clean FAB → CSF → FSF(HCR).
   - 화면에 들어오면 층이 위아래로 펼쳐짐(1회)
   - 라벨·층에 마우스를 올리면(터치는 탭) 해당 층만 또렷해지고 나머지는 흐려짐
   - [기존 방식 / HCR 적용] 버튼: FSF의 스크러버 8대·배출 8줄 ↔ HCR 3대·배출 3줄로 전환, 비워진 자리는 점선으로 표시
   WebGL을 쓸 수 없으면 기존 평면 그림(.why__svg)이 그대로 보임 */
import * as THREE from './vendor/three.module.min.js';

const sec = document.getElementById('why');
const host = document.getElementById('fab3d');
if (sec && host) init();

function init() {
  const canvas = host.querySelector('canvas');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
  catch (e) { return; }                       // WebGL 불가 → 평면 그림 유지
  document.documentElement.classList.add('fab3d-on');
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mqMobile = window.matchMedia('(max-width: 1024px)');

  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -100, 200);
  const CENTER = new THREE.Vector3(0, 3.7, 0);
  cam.position.set(20, 11.6, 20).add(CENTER); cam.lookAt(CENTER);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc9ced8, 1.25));
  const sun = new THREE.DirectionalLight(0xffffff, 1.7); sun.position.set(6, 14, 9); scene.add(sun);
  const root = new THREE.Group(); scene.add(root);

  /* ── 색 (사이트 토큰과 같은 값) ── */
  const C = { ink: 0x2B2C2F, blue: 0x223F99, navy: 0x202a3e, white: 0xf7f7f7, grey: 0x8f93a1, mid: 0xb9bcc6, glass: 0xdbe5f3 };
  const W = 10, D = 6.4, GAP = 3.4;

  /* ── 도형 도우미 ── */
  function slabGeo(w, d, h, r) {
    const s = new THREE.Shape(), x = -w / 2, y = -d / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
    s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 10 });
    g.rotateX(-Math.PI / 2); return g;       // 위쪽으로 두께
  }
  const mats = [];                           // 층별 투명도 조절 대상
  function mat(layer, color, o) {
    o = o || {};
    const m = new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? .62, metalness: o.metal ?? 0, transparent: true, opacity: o.opacity ?? 1, depthWrite: (o.opacity ?? 1) > .9, emissive: o.emissive ?? 0x000000, emissiveIntensity: o.ei ?? 0 });
    m.userData = { layer, base: m.opacity }; mats.push(m); return m;
  }
  function lineMat(layer, color, opacity) {
    const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    m.userData = { layer, base: opacity }; mats.push(m); return m;
  }
  function edges(mesh, layer, opacity) {
    const l = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 28), lineMat(layer, C.ink, opacity ?? .32));
    mesh.add(l); return l;
  }
  function box(g, layer, w, h, d, x, y, z, m, edgeOp) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y + h / 2, z); b.userData.layer = layer; g.add(b);
    if (edgeOp !== 0) edges(b, layer, edgeOp); return b;
  }
  function gridLines(w, d, step, y) {
    const p = [];
    for (let x = -w / 2; x <= w / 2 + 1e-6; x += step) p.push(x, y, -d / 2, x, y, d / 2);
    for (let z = -d / 2; z <= d / 2 + 1e-6; z += step) p.push(-w / 2, y, z, w / 2, y, z);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); return g;
  }

  /* ── 층 3개 (index 1=FSF, 2=CSF, 3=Clean FAB) ── */
  const layers = [];
  function addLayer(i) { const g = new THREE.Group(); g.userData = { i, baseY: (i - 1) * GAP }; root.add(g); layers[i] = g; return g; }
  const TX = [-3.3, -1.1, 1.1, 3.3];         // 메인 장비 4대의 x 위치
  const TZ = 1.0;

  // 3) Clean FAB — 흰 판 + 가공 장비(Main 설비) + 천장 반송 레일
  {
    const g = addLayer(3);
    const s = new THREE.Mesh(slabGeo(W, D, .16, .7), mat(3, C.white)); s.userData.layer = 3; g.add(s); edges(s, 3, .3);
    TX.forEach((x, k) => {
      box(g, 3, 1.15, .95, 1.5, x, .16, TZ, mat(3, C.white, { rough: .45 }), .38);
      box(g, 3, .7, .28, .7, x - .1, 1.11, TZ + .2, mat(3, C.mid), .3);
      box(g, 3, .5, .5, .9, x, .16, TZ - 1.75, mat(3, C.mid), .3);          // 보조 유닛
    });
    const rail = [];
    [-.25, .25].forEach(dz => rail.push(-4.6, 1.9, TZ + dz, 4.4, 1.9, TZ + dz));
    for (let x = -4.6; x <= 4.4; x += 1.5) rail.push(x, 1.9, TZ - .25, x, 1.9, TZ + .25);
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(rail, 3));
    g.add(new THREE.LineSegments(rg, lineMat(3, C.ink, .45)));
    g.userData.foups = [0, 1].map(k => box(g, 3, .34, .26, .34, -4 + k * 4, 1.6, TZ, mat(3, C.blue, { rough: .4 }), .5));
  }
  // 2) CSF — 타공 바닥(격자) + 보조 설비
  {
    const g = addLayer(2);
    const s = new THREE.Mesh(slabGeo(W, D, .1, .7), mat(2, C.mid, { opacity: .28 })); s.userData.layer = 2; g.add(s); edges(s, 2, .4);
    g.add(new THREE.LineSegments(gridLines(9.2, 5.6, .4, .11), lineMat(2, C.ink, .2)));
    [[-3.6, -1.9], [-1.2, -2.1], [1.4, -1.9], [3.6, 2.3], [-3.9, 2.4]].forEach((p, k) =>
      box(g, 2, k % 2 ? .9 : 1.2, k % 2 ? .8 : .6, .8, p[0], .1, p[1], mat(2, k % 2 ? C.white : C.grey), .34));
  }
  // 1) FSF — 짙은 판 + [기존] 스크러버 8대  ↔  [HCR] 3대 (버튼으로 전환)
  const yFsf = .22, DUCT = { z: -2.35, y: .6, r: .3, x0: -4.6, x1: 6.3 };
  const OLD = { w: 1.15, d: 1.15 };
  // 기존 스크러버 8대: 모두 판과 평행. 배관 사정에 맞춰 빈 곳마다 들어찬 배치 (x, z, 높이). 2대씩 같은 Main 설비에 연결
  const SC = [
    { x: -4.2, z: 2.1, h: 1.35 }, { x: -4.2, z: -.9, h: 1.45 },
    { x: -2.0, z: -.4, h: 1.4 }, { x: -.45, z: 2.1, h: 1.3 },
    { x: -.3, z: -1.5, h: 1.45 }, { x: .85, z: 1.4, h: 1.5 },
    { x: 3.9, z: -1.5, h: 1.3 }, { x: 3.45, z: -.3, h: 1.4 }].map(p => (p.r = 0, p));
  const HCR = { w: 1.05, h: 1.55, d: 1.05, z: TZ, xs: [-2.2, 0, 2.2] };
  const unitsA = [], unitsB = [], hcrMats = [];
  function grp(m, g) { m.userData.grp = g; return m; }
  {
    const g = addLayer(1);
    const s = new THREE.Mesh(slabGeo(W, D, .22, .7), mat(1, C.navy, { rough: .8 })); s.userData.layer = 1; g.add(s);
    SC.forEach(p => {
      const u = box(g, 1, OLD.w, p.h, OLD.d, p.x, yFsf, p.z, grp(mat(1, C.grey), 'A'), 0);
      u.add(new THREE.LineSegments(new THREE.EdgesGeometry(u.geometry), grp(lineMat(1, 0xffffff, .45), 'A')));
      u.userData.h = p.h; unitsA.push(u);
    });
    HCR.xs.forEach(x => {
      const hm = grp(mat(1, C.blue, { rough: .35, emissive: C.blue, ei: .35 }), 'B'); hcrMats.push(hm);
      const u = box(g, 1, HCR.w, HCR.h, HCR.d, x, yFsf, HCR.z, hm, 0);
      u.add(new THREE.LineSegments(new THREE.EdgesGeometry(u.geometry), grp(lineMat(1, 0xffffff, .75), 'B')));
      u.userData.h = HCR.h; unitsB.push(u);
    });
    // HCR 전환 시: 기존 스크러버가 차지하던 자리를 점선으로 남김(확보된 공간)
    const gp = [];
    SC.forEach(p => {
      const c = Math.cos(p.r), s = Math.sin(p.r), y = yFsf + .012, hw = OLD.w / 2, hd = OLD.d / 2;
      const q = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(v => [p.x + v[0] * c + v[1] * s, p.z - v[0] * s + v[1] * c]);
      for (let i = 0; i < 4; i++) { const n = q[(i + 1) % 4]; gp.push(q[i][0], y, q[i][1], n[0], y, n[1]); }
    });
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3));
    const gm = new THREE.LineDashedMaterial({ color: 0xffffff, transparent: true, opacity: .55, dashSize: .1, gapSize: .08 }); gm.userData = { layer: 1, base: .55, grp: 'B' }; mats.push(gm);
    const gl = new THREE.LineSegments(gg, gm); gl.computeLineDistances(); g.add(gl);
  }

  /* ── 배기 흐름: 배관 + 움직이는 입자 (층이 다 펼쳐진 뒤 나타남) ──
     [기존] 설비 1대 → 스크러버 2대(각 3줄, 꺾이며 얽힘) → 제각각 UT Duct 로 (배출 8줄)
     [HCR]  설비 4대 → 혼합 배기 헤더 → HCR 3대 → UT Duct 로 (배출 3줄) */
  const flow = new THREE.Group(); root.add(flow);
  const flowMats = [];
  const yFab = 2 * GAP + .16, yM = 2.5;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  function pipe(a, b, r, color, op, g) {
    const len = a.distanceTo(b), m = new THREE.MeshStandardMaterial({ color, roughness: .5, transparent: true, opacity: 0 });
    m.userData = { base: op, grp: g }; flowMats.push(m);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 14), m);
    c.position.copy(a).add(b).multiplyScalar(.5);
    c.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); flow.add(c);
  }
  function line(pts, r, color, op, g) { for (let i = 0; i < pts.length - 1; i++) pipe(pts[i], pts[i + 1], r, color, op, g); return pts; }
  const A = { in: [], out: [] }, B = { in: [], out: [] };
  // 기존: 스크러버 1대마다 배관 3줄이 서로 다른 높이에서 꺾여 내려옴(총 24줄), 배출도 제각각 꺾여 UT Duct 로
  const GREY = [0x55585f, 0x6D6E71, 0x8f93a1];
  SC.forEach((p, i) => {
    // 내려옴 → 옆으로 → 가로질러 → 한 단 내려옴 → 장비 쪽으로 → 내려옴. 줄마다 높이·차선이 달라 CSF 아래에서 겹겹이 얽힘
    const tx = TX[i >> 1], n = i * 3;
    for (let k = 0; k < 3; k++) {
      const q = n + k, sx = tx + (k - 1) * .2, sz = TZ + (i % 2 ? .42 : -.42), ex = p.x + (k - 1) * .2;
      const y1 = 3.15 - (q % 6) * .1, y2 = y1 - .5 - (i % 3) * .1, lz = -1.3 + (q % 9) * .26 - (i % 2) * .5;
      A.in.push(line([V(sx, yFab, sz), V(sx, y1, sz), V(sx, y1, lz), V(ex, y1, lz), V(ex, y2, lz), V(ex, y2, p.z), V(ex, yFsf + p.h, p.z)], .036, GREY[k], .9, 'A'));
    }
    const yo = yFsf + p.h * .5, xo = p.x + OLD.w / 2 + .32 + (i % 2) * .12;
    A.out.push(line([V(p.x + OLD.w / 2, yo, p.z), V(xo, yo, p.z), V(xo, DUCT.y, p.z), V(xo, DUCT.y, DUCT.z)], .055, 0x6D6E71, .9, 'A').concat([V(DUCT.x1, DUCT.y, DUCT.z)]));
  });
  // HCR
  const GAS = [0x2B2C2F, 0x6D6E71, 0xA3A4A6];   // 산 / 알칼리 / 유기 (농담으로만 구분)
  TX.forEach(x => { for (let k = 0; k < 4; k++) B.in.push(line([V(x + (k - 1.5) * .15, yFab, TZ), V(x + (k - 1.5) * .15, yM, TZ)], .038, GAS[k % 3], .9, 'B')); });   // 설비 1대당 4줄, 곧게 내려와 헤더로
  pipe(V(TX[0] - .3, yM, TZ), V(TX[3] + .3, yM, TZ), .13, C.mid, .95, 'B');                             // 혼합 배기 헤더
  HCR.xs.forEach(x => {
    B.in.push(line([V(x, yM, TZ), V(x, yFsf + HCR.h, TZ)], .09, 0x6D6E71, .9, 'B'));
    B.out.push(line([V(x, DUCT.y, HCR.z - HCR.d / 2), V(x, DUCT.y, DUCT.z)], .09, C.blue, .9, 'B').concat([V(DUCT.x1, DUCT.y, DUCT.z)]));
  });
  pipe(V(DUCT.x0, DUCT.y, DUCT.z), V(DUCT.x1, DUCT.y, DUCT.z), DUCT.r, C.mid, .5);                      // UT Duct Line
  function sampler(pts) {
    const seg = [], L = []; let tot = 0;
    for (let i = 0; i < pts.length - 1; i++) { const l = pts[i].distanceTo(pts[i + 1]); seg.push(l); tot += l; L.push(tot); }
    return (t, out) => { let d = t * tot, i = 0; while (i < seg.length - 1 && d > L[i]) i++; const s0 = L[i] - seg[i]; return out.lerpVectors(pts[i], pts[i + 1], Math.min(1, (d - s0) / seg[i])); };
  }
  const tmpV = new THREE.Vector3(), tmpM = new THREE.Matrix4();
  function swarm(paths, per, speed, color, r, g) {
    const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0 }); m.userData = { base: 1, grp: g }; flowMats.push(m);
    const im = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 12, 10), m, paths.length * per); flow.add(im);
    const ss = paths.map(sampler);
    return time => { let n = 0; ss.forEach((s, pi) => { for (let k = 0; k < per; k++) { s((time * speed + k / per + pi * .137) % 1, tmpV); tmpM.setPosition(tmpV); im.setMatrixAt(n++, tmpM); } }); im.instanceMatrix.needsUpdate = true; };
  }
  const swarms = [swarm(A.in, 2, .1, 0x2B2C2F, .06, 'A'), swarm(A.out, 3, .08, 0x55585f, .075, 'A'), swarm(B.in, 2, .3, 0x55585f, .06, 'B'), swarm(B.out, 5, .09, C.blue, .1, 'B')];
  function drawFlow(time) { swarms.forEach(f => f(time)); }

  /* ── 바닥 그림자 ── */
  {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d');
    const gr = x.createRadialGradient(64, 64, 6, 64, 64, 64); gr.addColorStop(0, 'rgba(32,42,62,.34)'); gr.addColorStop(1, 'rgba(32,42,62,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.7, D * 1.9), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = -.9; root.add(sh);
  }

  /* ── 라벨(HTML): 3D 위치를 화면 좌표로 옮겨 붙임 ── */
  const labels = [].slice.call(host.querySelectorAll('.fab3d__lb')).map(el => {
    const k = el.getAttribute('data-k'), right = el.classList.contains('fab3d__lb--r');
    let layer = +el.getAttribute('data-layer'), local;
    if (k === 'hcr') local = new THREE.Vector3(HCR.xs[2] + HCR.w / 2, yFsf + HCR.h * .7, HCR.z);
    else if (k === 'old') local = new THREE.Vector3(SC[6].x + OLD.w / 2, yFsf + SC[6].h * .7, SC[6].z);
    else local = right ? new THREE.Vector3(W / 2 - .25, .1, -D / 2 + .25) : new THREE.Vector3(-W / 2 + .25, .1, D / 2 - .25);
    return { el, layer, local, k };
  });

  /* ── 상태 ── */
  let ready = false;
  let mode = 0, modeT = 0, tSwitch = -1e9;      // 0=기존, 1=HCR
  let active = 0, explode = reduce ? 1 : 0, started = reduce, t0 = 0, vis = false, w = 0, h = 0;
  const fade = [0, 1, 1, 1]; let flowOp = reduce ? 1 : 0, rotY = 0, rotT = 0, px = 0;
  function setActive(i) {
    active = i; sec.setAttribute('data-active', String(i));
    labels.forEach(l => { const on = i && (l.layer === i); l.el.classList.toggle('is-active', !!on); l.el.classList.toggle('is-dim', !!i && !on); l.el.setAttribute('aria-expanded', on ? 'true' : 'false'); });
  }

  function resize() {
    const r = canvas.getBoundingClientRect(); w = Math.round(r.width); h = Math.round(r.height); if (!w || !h) return;
    renderer.setSize(w, h, false);
    const a = w / h, vh = Math.max(16.2, 14.6 / a) / 2, ox = mqMobile.matches ? 0 : vh * a * .14;   // 넓은 화면: 오른쪽 HCR 설명 자리를 위해 그림을 왼쪽으로
    cam.left = -vh * a + ox; cam.right = vh * a + ox; cam.top = vh; cam.bottom = -vh; cam.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(() => { resize(); if (!vis) frame(performance.now()); }); ro.observe(canvas);

  /* ── 포인터: 층 고르기 ── */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let hoverDirty = false, lastType = 'mouse';
  function pick() {
    ray.setFromCamera(ndc, cam);
    const hit = ray.intersectObjects(layers.filter(Boolean), true).find(o => o.object.userData.layer);
    return hit ? hit.object.userData.layer : 0;
  }
  function toNdc(e) { const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height * 2 - 1)); px = ndc.x; }
  canvas.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; toNdc(e); hoverDirty = true; });
  canvas.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { px = 0; setActive(0); } });
  canvas.addEventListener('click', e => { toNdc(e); const l = pick(); if (lastType !== 'mouse') setActive(active === l ? 0 : l); });
  sec.addEventListener('pointerdown', e => { lastType = e.pointerType || 'mouse'; }, true);
  labels.forEach(l => {
    l.el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') setActive(l.layer); });
    l.el.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') setActive(0); });
    l.el.addEventListener('click', () => { if (lastType !== 'mouse') setActive(active === l.layer ? 0 : l.layer); });
    l.el.addEventListener('focus', () => { if (l.el.matches(':focus-visible')) setActive(l.layer); });
    l.el.addEventListener('blur', () => setActive(0));
  });
  sec.addEventListener('keydown', e => { if (e.key === 'Escape') setActive(0); });

  /* ── 기존 방식 ↔ HCR 적용 전환 ── */
  const modeBtns = [].slice.call(sec.querySelectorAll('.fab3d__mode button'));
  function setMode(v, user) {
    modeT = v; if (v) tSwitch = performance.now();
    sec.setAttribute('data-mode', v ? 'hcr' : 'old');
    modeBtns.forEach(b => { b.setAttribute('aria-pressed', String(+b.getAttribute('data-mode') === v)); if (user) b.classList.remove('is-hint'); });
    if (ready && (reduce || !vis)) frame(performance.now());
  }
  modeBtns.forEach(b => b.addEventListener('click', () => setMode(+b.getAttribute('data-mode'), true)));
  setMode(0);

  /* ── 그리기 ── */
  const proj = new THREE.Vector3(), edge = new THREE.Vector3(); let raf = 0, last = 0;
  function frame(now) {
    const time = now / 1000, dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
    if (started && explode < 1) { const p = Math.min(1, (now - t0) / 1700); explode = 1 - Math.pow(1 - p, 3); }
    if (hoverDirty) { hoverDirty = false; const l = pick(); if (l !== active) setActive(l); }
    const k = 1 - Math.pow(.001, dt);          // 부드러운 따라가기
    for (let i = 1; i <= 3; i++) {
      fade[i] += ((active && active !== i ? .16 : 1) - fade[i]) * k;
      layers[i].position.y = layers[i].userData.baseY * (.18 + .82 * explode) + (active === i ? .12 : 0);
    }
    mode += (modeT - mode) * (reduce ? 1 : k * .7);
    const gA = Math.max(0, 1 - mode * 1.6), gB = Math.max(0, mode * 1.6 - .6), gf = g => g === 'A' ? gA : g === 'B' ? gB : 1;
    mats.forEach(m => { m.opacity = m.userData.base * fade[m.userData.layer] * gf(m.userData.grp); m.visible = m.opacity > .01; });
    unitsA.forEach(u => { const s = Math.max(.001, gA); u.scale.y = s; u.position.y = yFsf + u.userData.h * s / 2; u.visible = gA > .01; });
    unitsB.forEach((u, i) => { const p = Math.min(1, Math.max(0, gB * 1.25 - i * .12)), s = Math.max(.001, 1 + 2.2 * Math.pow(p - 1, 3) + 1.2 * Math.pow(p - 1, 2)); u.scale.y = s; u.position.y = yFsf + u.userData.h * s / 2; u.visible = gB > .01; });
    const pulse = reduce ? 0 : Math.max(0, 1 - (now - tSwitch) / 2200) * (.5 + .5 * Math.sin(time * 13)); hcrMats.forEach(m => { m.emissiveIntensity = .35 + pulse * .9; });
    flowOp += ((explode > .98 ? (active && active !== 1 ? .3 : 1) : 0) - flowOp) * k;
    flowMats.forEach(m => { m.opacity = m.userData.base * flowOp * gf(m.userData.grp); m.visible = m.opacity > .01; });   // 안 보이는 것은 아예 그리지 않음(뒤의 물체를 가리는 흔적 방지) flow.visible = flowOp > .01;
    if (!reduce) { drawFlow(time); const f = layers[3].userData.foups; f[0].position.x = -4 + ((time * .5) % 8.2); f[1].position.x = -4 + ((time * .5 + 4.1) % 8.2); }
    else drawFlow(0);
    rotT = reduce ? 0 : px * .16 + Math.sin(time * .35) * .035; rotY += (rotT - rotY) * k * .6; root.rotation.y = rotY;
    renderer.render(scene, cam);
    if (!mqMobile.matches) labels.forEach(l => {
      proj.copy(l.local); layers[l.layer].localToWorld(proj); proj.project(cam);
      if (l.k === 'hcr' || l.k === 'old') { const ax = (proj.x * .5 + .5) * w; edge.set(W / 2, .1, -D / 2); layers[1].localToWorld(edge); edge.project(cam); l.el.style.setProperty('--lw', Math.max(40, (edge.x * .5 + .5) * w - ax + 26).toFixed(0) + 'px'); }
      l.el.style.transform = 'translate3d(' + ((proj.x * .5 + .5) * w).toFixed(1) + 'px,' + ((-proj.y * .5 + .5) * h).toFixed(1) + 'px,0)';
    });
    if (vis && !reduce) raf = requestAnimationFrame(frame);
  }
  function clearLabelPos() { labels.forEach(l => { l.el.style.transform = ''; }); }
  mqMobile.addEventListener('change', () => { clearLabelPos(); resize(); frame(performance.now()); });

  new IntersectionObserver(es => {
    vis = es[0].isIntersecting;
    if (vis && !started && es[0].intersectionRatio > .25) { started = true; t0 = performance.now(); }
    cancelAnimationFrame(raf); if (vis) raf = requestAnimationFrame(frame);
  }, { threshold: [0, .25, .5] }).observe(host);

  ready = true; resize(); drawFlow(0); frame(performance.now());
  host.classList.add('is-ready');
}
