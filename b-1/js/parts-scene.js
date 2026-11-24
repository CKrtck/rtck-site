/* Parts 장면 1: 스크롤 진행도(0~1)를 --pzp 로 넘겨 대표 이미지가 미세하게 이동 */
(function(){
  var s=document.querySelector('.pz'); if(!s) return;
  var tick=false;
  function run(){ tick=false; var p=Math.max(0,Math.min(1,window.scrollY/(window.innerHeight||1))); s.style.setProperty('--pzp',p.toFixed(4)); }
  window.addEventListener('scroll',function(){ if(!tick){ tick=true; requestAnimationFrame(run); } },{passive:true});
  window.addEventListener('resize',run); run();
})();
