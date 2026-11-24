/* HCR Core Technology 팝업 — hcr-tech-white.html 의 initCoreTech() 원본 그대로.
   #ctm 이 있을 때만 동작하고 자체 리스너만 사용하므로 site.js·hcr.js 와 독립. 페이지 끝에서 로드되어 바로 초기화. */
function initCoreTech(){
  var m=document.getElementById('ctm'); if(!m) return;
  var card=m.querySelector('.ctc'), inner=m.querySelector('.ctin'), bg=m.querySelector('.ctbg');
  var panels=[].slice.call(document.querySelectorAll('.ctp'));
  var K=document.getElementById('ctmK'),T=document.getElementById('ctmT'),Sm=document.getElementById('ctmS'),U=document.getElementById('ctmU'),
      C=document.getElementById('ctmC'),Pv=document.getElementById('ctmP'),Nx=document.getElementById('ctmN'),X=document.getElementById('ctmX');
  var fig=m.querySelector('.ctfig svg');
  var cur=0, open=false, busy=false;
  var RM=window.matchMedia('(prefers-reduced-motion: reduce)');
  var DUR=320, EASE='cubic-bezier(.2,.7,.2,1)';
  function after(a,ms,fn){var d=false;var g=function(){if(!d){d=true;fn();}};if(a)a.onfinish=g;setTimeout(g,ms+60);}
  function pad(n){return ('0'+(n+1)).slice(-2);}
  function fill(i){
    cur=(i+3)%3; var p=panels[cur];
    K.textContent='HCR WET SCRUBBER · '+pad(cur);
    T.textContent=p.querySelector('.en').textContent;
    Sm.textContent=p.getAttribute('data-sum');
    U.setAttribute('href','#ctD'+(cur+1));
    fig.setAttribute('aria-label',p.querySelector('.en').textContent+' 다이어그램');
    C.textContent=pad(cur)+' / 03';
    Pv.textContent='← '+pad(cur-1<0?2:cur-1);
    Nx.textContent=pad((cur+1)%3)+' →';
    var sc=m.querySelector('.ctfig'); if(sc.scrollWidth>sc.clientWidth) sc.scrollLeft=(sc.scrollWidth-sc.clientWidth)/2;
  }
  function clipFrom(p){
    var r=p.getBoundingClientRect(), c=card.getBoundingClientRect();
    var t=Math.max(0,r.top-c.top), l=Math.max(0,r.left-c.left), b=Math.max(0,c.bottom-r.bottom), rr=Math.max(0,c.right-r.right);
    if(t+b>c.height-20){t=Math.min(t,c.height-20);b=0;}
    return 'inset('+t+'px '+rr+'px '+b+'px '+l+'px round 8px)';
  }
  function show(i){
    if(open||busy) return; open=true; busy=true;
    var sw=window.innerWidth-document.documentElement.clientWidth;
    document.documentElement.classList.add('ctlock'); if(sw>0) document.body.style.paddingRight=sw+'px';
    m.hidden=false; fill(i);
    var done=function(){busy=false;X.focus({preventScroll:true});};
    if(RM.matches||!card.animate){
      after(card.animate?m.animate([{opacity:0},{opacity:1}],{duration:200,easing:'ease-out'}):null,200,done);
      return;
    }
    bg.animate([{opacity:0},{opacity:1}],{duration:DUR,easing:'ease-out'});
    inner.animate([{opacity:0},{opacity:0,offset:.35},{opacity:1}],{duration:DUR+80,easing:'ease-out'});
    m.querySelectorAll('.ctx,.ctnav').forEach(function(e){e.animate([{opacity:0},{opacity:0,offset:.5},{opacity:1}],{duration:DUR+80});});
    card.animate([{clipPath:clipFrom(panels[cur])},{clipPath:'inset(0px 0px 0px 0px round 8px)'}],{duration:DUR,easing:EASE}); after(null,DUR,done);
  }
  function hide(){
    if(!open||busy) return; busy=true;
    var end=function(){
      m.hidden=true; open=false; busy=false;
      document.documentElement.classList.remove('ctlock'); document.body.style.paddingRight='';
      panels[cur].focus({preventScroll:true});
    };
    if(RM.matches||!card.animate){ var fa=card.animate?m.animate([{opacity:1},{opacity:0}],{duration:160,fill:'forwards'}):null; after(fa,160,function(){if(fa)fa.cancel();end();}); return; }
    bg.animate([{opacity:1},{opacity:0}],{duration:DUR,easing:'ease-in',fill:'forwards'});
    inner.animate([{opacity:1},{opacity:0,offset:.5},{opacity:0}],{duration:DUR,fill:'forwards'});
    m.querySelectorAll('.ctx,.ctnav').forEach(function(e){e.animate([{opacity:1},{opacity:0,offset:.4},{opacity:0}],{duration:DUR,fill:'forwards'});});
    var a=card.animate([{clipPath:'inset(0px 0px 0px 0px round 8px)'},{clipPath:clipFrom(panels[cur])}],{duration:DUR,easing:'cubic-bezier(.4,0,.6,1)',fill:'forwards'});
    after(a,DUR,function(){ m.getAnimations({subtree:true}).forEach(function(x){x.cancel();}); end(); });
  }
  function go(d){
    if(!open||busy) return; busy=true;
    var t=RM.matches?0:140;
    var a=t?inner.animate([{opacity:1},{opacity:0}],{duration:t,easing:'ease-in',fill:'forwards'}):null;
    after(a,t,function(){ if(a)a.cancel(); fill(cur+d); busy=false; if(t) inner.animate([{opacity:0},{opacity:1}],{duration:200,easing:'ease-out'}); });
  }
  panels.forEach(function(p,i){
    p.addEventListener('click',function(){show(i);});
    p.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){e.preventDefault();show(i);} });
  });
  X.addEventListener('click',hide);
  bg.addEventListener('click',hide);
  Pv.addEventListener('click',function(){go(-1);});
  Nx.addEventListener('click',function(){go(1);});
  document.addEventListener('keydown',function(e){
    if(!open) return;
    if(e.key==='Escape'){e.preventDefault();hide();}
    else if(e.key==='ArrowLeft'){e.preventDefault();go(-1);}
    else if(e.key==='ArrowRight'){e.preventDefault();go(1);}
    else if(e.key==='Tab'){
      var f=[X,Pv,Nx]; var ix=f.indexOf(document.activeElement);
      e.preventDefault(); f[(ix+(e.shiftKey?-1:1)+f.length)%f.length].focus();
    }
  });
  m.addEventListener('wheel',function(e){ if(!e.target.closest('.ctfig')||e.deltaX===0) e.preventDefault(); },{passive:false});
  m.addEventListener('touchmove',function(e){ if(!e.target.closest('.ctfig')) e.preventDefault(); },{passive:false});
}
initCoreTech();
/* 모션 줄이기 설정이면 다이어그램 애니메이션 정지 */
if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){[].forEach.call(document.querySelectorAll('#core svg'),function(s){if(s.pauseAnimations)s.pauseAnimations();});}
