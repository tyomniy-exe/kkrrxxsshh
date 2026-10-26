/* ===== мобильное меню ===== */
const burger=document.getElementById('burger'),navLinks=document.getElementById('navLinks');
if(burger) burger.addEventListener('click',()=>{burger.classList.toggle('open');navLinks.classList.toggle('open')});
if(navLinks) navLinks.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{burger&&burger.classList.remove('open');navLinks.classList.remove('open')}));

/* ===== reveal ===== */
const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

/* ===== аккордеон услуг ===== */
document.querySelectorAll('.service').forEach(svc=>{
  const head=svc.querySelector('.service-head');
  if(!head) return;
  head.addEventListener('click',()=>{
    const isOpen=svc.classList.contains('open');
    document.querySelectorAll('.service').forEach(s=>s.classList.remove('open'));
    if(!isOpen) svc.classList.add('open');
  });
});

/* ===== часы в трее ===== */
function tickClock(){
  const c=document.getElementById('xpClock');
  if(!c) return;
  const d=new Date();
  const hh=String(d.getHours()).padStart(2,'0');
  const mm=String(d.getMinutes()).padStart(2,'0');
  c.textContent=`${hh}:${mm}`;
}
setInterval(tickClock,15000);tickClock();

/* ===== счётчик посещений ===== */
(function hitCounter(){
  const el=document.getElementById('hitCounter');
  if(!el) return;
  let n = +localStorage.getItem('hitCount') || 0;
  n++;
  localStorage.setItem('hitCount', n);
  el.textContent = String(n).padStart(6,'0');
})();

/* =========================================================
   АУДИО-ДВИЖОК
   ========================================================= */
const audio = document.getElementById('globalAudio');
const beatRows  = [...document.querySelectorAll('.audio-row.beat-row')];
const trackRows = [...document.querySelectorAll('.audio-row.track-row')];
const allRows   = [...beatRows, ...trackRows];
let activeList = trackRows;
let currentIdx = 0;

function fmt(t){
  if(!isFinite(t)) return '0:00';
  const m=Math.floor(t/60), s=String(Math.floor(t%60)).padStart(2,'0');
  return `${m}:${s}`;
}
function setRowState(list, idx, playing){
  list.forEach((r,i)=>{
    const b=r.querySelector('.ar-play');
    if(!b) return;
    if(i===idx){
      r.classList.add('active');
      b.classList.toggle('playing', playing);
      b.textContent = playing ? '⏸' : '▶';
    } else {
      r.classList.remove('active');
      b.classList.remove('playing');
      b.textContent='▶';
    }
  });
}

const plPlay = document.getElementById('plPlay');
const plTitle= document.getElementById('plTitle');
const plMeta = document.getElementById('plMeta');
const plProgress = document.getElementById('plProgress');
const plFill = plProgress ? plProgress.querySelector('.ar-fill') : null;
const plTime = document.getElementById('plTime');
const plArt  = document.getElementById('plArt');
const nextBtn= document.getElementById('nextTrack');
const prevBtn= document.getElementById('prevTrack');

function loadIntoPlayer(list, idx, autoplay){
  activeList=list;
  currentIdx=(idx+list.length)%list.length;
  const row=list[currentIdx];
  if(!row) return;
  audio.src=row.dataset.src;
  if(plTitle) plTitle.textContent=row.dataset.title||'—';
  if(plMeta)  plMeta.textContent=row.dataset.meta||'';
  if(plArt && row.dataset.cover){plArt.src=row.dataset.cover;plArt.style.display=''}
  if(plFill) plFill.style.width='0%';
  if(plTime) plTime.textContent='0:00 / 0:00';
  if(autoplay){
    audio.play().then(()=>{if(plPlay) plPlay.textContent='⏸'}).catch(()=>{if(plPlay) plPlay.textContent='▶'});
  } else {
    if(plPlay) plPlay.textContent='▶';
  }
  setRowState(list,currentIdx,autoplay);
}

allRows.forEach(row=>{
  const list=row.classList.contains('track-row')?trackRows:beatRows;
  const idx=list.indexOf(row);
  const btn=row.querySelector('.ar-play');
  const progress=row.querySelector('[data-role="progress"]');
  const vol=row.querySelector('.ar-vol-range');
  const volBtn=row.querySelector('.ar-vol-btn');

  if(btn){
    btn.type='button';
    btn.addEventListener('click',(e)=>{
      e.preventDefault();
      e.stopPropagation();
      if(list===activeList && idx===currentIdx && audio.src){
        if(audio.paused){
          audio.play().then(()=>setRowState(list,idx,true)).catch(()=>{});
        } else {
          audio.pause(); setRowState(list,idx,false);
        }
      } else {
        loadIntoPlayer(list,idx,true);
      }
    });
  }
  if(progress){
    progress.addEventListener('click',e=>{
      if(list!==activeList||idx!==currentIdx) return;
      const r=progress.querySelector('.ar-bar').getBoundingClientRect();
      const pct=Math.min(1,Math.max(0,(e.clientX-r.left)/r.width));
      if(audio.duration) audio.currentTime=audio.duration*pct;
    });
  }
  if(vol) vol.addEventListener('input',()=>audio.volume=+vol.value);
  if(volBtn){
    volBtn.type='button';
    volBtn.addEventListener('click',()=>audio.muted=!audio.muted);
  }
});

if(plPlay){
  plPlay.type='button';
  plPlay.addEventListener('click',(e)=>{
    e.preventDefault();
    if(!audio.src){loadIntoPlayer(trackRows,0,true);return}
    if(audio.paused){
      audio.play().then(()=>{plPlay.textContent='⏸';setRowState(activeList,currentIdx,true)}).catch(()=>{});
    } else {
      audio.pause(); plPlay.textContent='▶'; setRowState(activeList,currentIdx,false);
    }
  });
}

if(plProgress){
  plProgress.addEventListener('click',e=>{
    const r=plProgress.querySelector('.ar-bar').getBoundingClientRect();
    const pct=Math.min(1,Math.max(0,(e.clientX-r.left)/r.width));
    if(audio.duration) audio.currentTime=audio.duration*pct;
  });
}

if(nextBtn) nextBtn.addEventListener('click',()=>loadIntoPlayer(activeList,currentIdx+1,true));
if(prevBtn) prevBtn.addEventListener('click',()=>loadIntoPlayer(activeList,currentIdx-1,true));

function updateProgress(){
  if(!audio.duration) return;
  const pct=(audio.currentTime/audio.duration)*100;
  if(plFill) plFill.style.width=pct+'%';
  if(plTime) plTime.textContent=`${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
  const row=activeList[currentIdx];
  if(row){
    const fill=row.querySelector('.ar-fill');
    const time=row.querySelector('.ar-time');
    if(fill) fill.style.width=pct+'%';
    if(time) time.textContent=`${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
  }
}
audio.addEventListener('timeupdate',updateProgress);
audio.addEventListener('loadedmetadata',updateProgress);
audio.addEventListener('ended',()=>{
  if(plPlay) plPlay.textContent='▶';
  setRowState(activeList,currentIdx,false);
  loadIntoPlayer(activeList,currentIdx+1,true);
});
audio.addEventListener('play',()=>{if(plPlay) plPlay.textContent='⏸';setRowState(activeList,currentIdx,true)});
audio.addEventListener('pause',()=>{if(plPlay) plPlay.textContent='▶';setRowState(activeList,currentIdx,false)});

/* ===== МОДАЛКА ПЛОЩАДОК ===== */
const modal = document.getElementById('platformModal');
const openPlatforms = document.getElementById('openPlatforms');
function openModal(){ if(modal) modal.classList.add('open'); }
function closeModal(){ if(modal) modal.classList.remove('open'); }

if(openPlatforms){
  openPlatforms.type='button';
  openPlatforms.addEventListener('click',(e)=>{
    e.preventDefault();
    e.stopPropagation();
    openModal();
  });
}
if(modal){
  modal.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',closeModal));
  const closeBtn = modal.querySelector('.xp-close');
  if(closeBtn){
    closeBtn.type='button';
    closeBtn.addEventListener('click',(e)=>{e.preventDefault();e.stopPropagation();closeModal();});
  }
}
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeModal(); });