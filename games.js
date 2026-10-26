/* =========================================================
   KKRX GAMES — кошелёк, лимит попыток, игра, магазин
   (версия под новый интерфейс g-*)
   ========================================================= */

const Store = {
  get(k, d){ try{ return JSON.parse(localStorage.getItem('kkrx_'+k)) ?? d }catch(e){ return d } },
  set(k, v){ localStorage.setItem('kkrx_'+k, JSON.stringify(v)) }
};

/* ===== ПОПЫТКИ (5 в день, сброс в полночь) ===== */
const MAX_ATTEMPTS = 5;
function todayStr(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function getAttempts(){
  const a = Store.get('attempts', {date: todayStr(), used: 0});
  if(a.date !== todayStr()) return {date: todayStr(), used: 0};
  return a;
}
function setAttempts(a){ Store.set('attempts', a); }
function attemptsLeft(){ return MAX_ATTEMPTS - getAttempts().used; }

/* ===== ОЧКИ ===== */
function getPoints(){ return Store.get('points', 0); }
function addPoints(n){ Store.set('points', Math.max(0, getPoints()+n)); renderWallet(); }

/* ===== ПРОМОКОДЫ ===== */
function getPromos(){ return Store.get('promos', []); }
function addPromo(p){ const l = getPromos(); l.unshift(p); Store.set('promos', l); renderPromos(); }

/* ===== РЕНДЕР КОШЕЛЬКА ===== */
function renderWallet(){
  const p = document.getElementById('pointsVal');
  const a = document.getElementById('attemptsVal');
  if(p) p.textContent = getPoints();
  if(a) a.textContent = `${attemptsLeft()}/${MAX_ATTEMPTS}`;

  const note = document.getElementById('attemptsNote');
  if(note){
    const left = attemptsLeft();
    note.textContent = left > 0
      ? `У тебя ${left} из ${MAX_ATTEMPTS} попыток на сегодня.`
      : `Попытки на сегодня кончились. Возвращайся завтра!`;
  }
  const startBtn = document.getElementById('startGame');
  if(startBtn) startBtn.disabled = attemptsLeft() <= 0;
}

/* ===== МАГАЗИН ===== */
const SHOP_ITEMS = [
  {id:'d5',   name:'СКИДКА 5%',       price:10000,  type:'discount', value:5},
  {id:'d10',  name:'СКИДКА 10%',      price:20000,  type:'discount', value:10},
  {id:'d15',  name:'СКИДКА 15%',      price:30000,  type:'discount', value:15},
  {id:'d25',  name:'СКИДКА 25%',      price:50000,  type:'discount', value:25},
  {id:'beat', name:'БЕСПЛАТНЫЙ БИТ',  price:100000, type:'freebie',  value:100},
];

function renderShop(){
  const grid = document.getElementById('shopGrid');
  if(!grid) return;
  const pts = getPoints();
  grid.innerHTML = SHOP_ITEMS.map(it=>{
    const ok = pts >= it.price;
    return `<div class="g-shop-card ${ok?'affordable':''}">
      <div class="g-shop-name">${it.name}</div>
      <div class="g-shop-price">${it.price}<small>очков</small></div>
      <button class="g-btn" data-buy="${it.id}" ${ok?'':'disabled'}>
        ${ok?'КУПИТЬ':'НЕ ХВАТАЕТ'}
      </button>
    </div>`;
  }).join('');

  grid.querySelectorAll('[data-buy]').forEach(b=>{
    b.addEventListener('click', ()=>{
      const item = SHOP_ITEMS.find(x=>x.id===b.dataset.buy);
      if(item) buyItem(item);
    });
  });
}

/* ===== ID ИГРОКА ===== */
function getPlayerId(){
  let id = Store.get('playerId', null);
  if(!id){
    const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s='';
    for(let i=0;i<6;i++) s += chars[Math.floor(Math.random()*chars.length)];
    id = s;
    Store.set('playerId', id);
  }
  return id;
}

/* ===== УНИКАЛЬНЫЙ КОД ===== */
function genUniqueCode(prefix){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let nonce='';
  for(let i=0;i<6;i++) nonce += chars[Math.floor(Math.random()*chars.length)];
  const pid = getPlayerId();
  const ts = Date.now().toString(36).slice(-4).toUpperCase();
  return `KKRX-${prefix}-${pid}-${nonce}-${ts}`;
}

/* ===== ПОКУПКА ===== */
function buyItem(item){
  if(getPoints() < item.price){ alert('Не хватает очков'); return; }
  if(!confirm(`Купить «${item.name}» за ${item.price} очков?`)) return;

  addPoints(-item.price);

  let code = '';
  if(item.type === 'discount'){
    code = genUniqueCode(`${item.value}`);
    addPromo({
      code, type:'discount', value:item.value,
      label:`Скидка ${item.value}%`,
      ts: Date.now(),
      used: false
    });
  } else {
    code = genUniqueCode('FREE');
    addPromo({
      code, type:'freebie', value:100,
      label:'Бесплатный бит',
      ts: Date.now(),
      used: false
    });
  }

  alert(
    `Готово!\n\nПромокод:\n${code}\n\n` +
    `Он сохранён во вкладке «МОИ ПРОМОКОДЫ».\n` +
    `Отправь его в ТГ: @kkrrxxsshh\n\n` +
    `ВАЖНО: код одноразовый и привязан к твоему ID.`
  );
  renderShop();
  renderPromos();
}

/* ===== ПРОМОКОДЫ РЕНДЕР ===== */
function renderPromos(){
  const list = document.getElementById('promoList');
  if(!list) return;
  const promos = getPromos();

  if(!promos.length){
    list.innerHTML = '<div class="g-empty">пока пусто. копи очки в игре и покупай скидки в магазине.</div>';
    return;
  }

  list.innerHTML = promos.map((p,i)=>`
    <div class="g-promo">
      <div class="g-promo-info">
        <code class="g-promo-code">${p.code}</code>
        <div class="g-promo-meta">${p.label} · ${new Date(p.ts).toLocaleDateString('ru')}</div>
      </div>
      <button class="g-copy-btn" data-copy="${i}">КОПИРОВАТЬ</button>
    </div>
  `).join('');

  list.querySelectorAll('[data-copy]').forEach(b=>{
    b.addEventListener('click', ()=>{
      const p = promos[+b.dataset.copy];
      navigator.clipboard.writeText(p.code).then(()=>{
        const old = b.textContent;
        b.textContent = '✓';
        setTimeout(()=>{ b.textContent = old; }, 1200);
      }).catch(()=>{
        // fallback, если clipboard недоступен
        prompt('Скопируй код вручную:', p.code);
      });
    });
  });
}

/* =========================================================
   ИГРА
   ========================================================= */
const GOOD_ICONS = [
  'files/icons/good1.png',
  'files/icons/good2.png',
  'files/icons/good3.png',
];
const BAD_ICONS = [
  'files/icons/bad1.png',
  'files/icons/bad2.png',
  'files/icons/bad3.png',
];

const GAME_DURATION = 60_000;
const GOOD_PTS   = 4;
const BAD_PTS    = -15;
const MISS_PENALTY = -1;
const ICON_SIZE  = 44;

const el = id => document.getElementById(id);
const introEl = el('gameIntro');
const stageEl = el('gameStage');
const resultEl= el('gameResult');
const fieldEl = el('gameField');
const hudTime = el('hudTime');
const hudScore= el('hudScore');
const resultScoreEl = el('resultScore');
const resultTotalEl = el('resultTotal');

let game = null;

function startGame(){
  if(attemptsLeft() <= 0){
    alert('Попытки на сегодня кончились. Возвращайся завтра!');
    return;
  }

  const a = getAttempts();
  a.used++;
  setAttempts(a);
  renderWallet();

  introEl.hidden = true;
  resultEl.hidden = true;
  stageEl.hidden = false;
  fieldEl.innerHTML = '';
  hudScore.textContent = '0';
  hudTime.textContent = '60';

  game = {
    score: 0,
    endTime: performance.now() + GAME_DURATION,
    icons: new Set(),
    spawnTimer: null,
    raf: null,
    lastTs: 0
  };

  game.spawnTimer = setInterval(spawnIcon, 300);
  game.raf = requestAnimationFrame(tick);
}

function spawnIcon(){
  if(!game) return;
  const isBad = Math.random() < 0.35;
  const pool = isBad ? BAD_ICONS : GOOD_ICONS;
  const src = pool[Math.floor(Math.random()*pool.length)];

  const rect = fieldEl.getBoundingClientRect();
  const x = Math.random() * (rect.width - ICON_SIZE);
  const speed = 200 + Math.random() * 130;

  const node = document.createElement('img');
  node.className = 'falling-ico ' + (isBad ? 'bad' : 'good');
  node.src = src;
  node.alt = '';
  node.draggable = false;
  node.style.left = x + 'px';
  node.style.top = '-50px';
  node.dataset.bad = isBad ? '1' : '0';
  node.dataset.y = '-50';
  node.dataset.speed = speed;

  // Убираем стандартное поведение (контекстное меню, перетаскивание)
  node.addEventListener('contextmenu', e => e.preventDefault());
  node.addEventListener('dragstart', e => e.preventDefault());

  // Обработка нажатия
  node.addEventListener('pointerdown', (e)=>{
    e.preventDefault();
    e.stopPropagation(); // Чтобы клик не уходил в поле
    if(!game) return;
    collectIcon(node);
  });

  fieldEl.appendChild(node);
  game.icons.add(node);
}

function collectIcon(node){
  if(!node.parentNode) return;
  const isBad = node.dataset.bad === '1';
  const dx = parseFloat(node.style.left) + 16;
  const dy = parseFloat(node.dataset.y) + 16;

  game.score += isBad ? BAD_PTS : GOOD_PTS;
  if(game.score < 0) game.score = 0;
  hudScore.textContent = game.score;

  if(hudScore.animate){
    hudScore.animate(
      [{transform:'scale(1.2)'},{transform:'scale(1)'}],
      {duration:180, easing:'ease-out'}
    );
  }

  const pop = document.createElement('div');
  pop.className = 'score-pop ' + (isBad ? 'bad' : 'good');
  pop.textContent = isBad ? BAD_PTS : '+'+GOOD_PTS;
  pop.style.left = dx + 'px';
  pop.style.top  = dy + 'px';
  fieldEl.appendChild(pop);
  setTimeout(()=>pop.remove(), 550);

  node.remove();
  game.icons.delete(node);
}

function tick(ts){
  if(!game) return;
  if(!game.lastTs) game.lastTs = ts;
  const dt = Math.min(0.05, (ts - game.lastTs) / 1000);
  game.lastTs = ts;

  const remaining = Math.max(0, game.endTime - performance.now());
  hudTime.textContent = Math.ceil(remaining / 1000);

  const fieldH = fieldEl.clientHeight;
  game.icons.forEach(node=>{
    const y = parseFloat(node.dataset.y) + parseFloat(node.dataset.speed) * dt;
    node.dataset.y = y;
    node.style.top = y + 'px';

    if(y > fieldH){
      const isBad = node.dataset.bad === '1';
      if(!isBad){
        game.score += MISS_PENALTY;
        if(game.score < 0) game.score = 0;
        hudScore.textContent = game.score;
      }
      node.remove();
      game.icons.delete(node);
    }
  });

  if(remaining <= 0){
    endGame();
    return;
  }
  game.raf = requestAnimationFrame(tick);
}

function endGame(){
  if(!game) return;
  clearInterval(game.spawnTimer);
  cancelAnimationFrame(game.raf);
  game.icons.forEach(n=>n.remove());
  game.icons.clear();

  const gained = game.score;
  const total  = getPoints() + gained;
  Store.set('points', total);

  resultScoreEl.textContent = gained;
  resultTotalEl.textContent = total;

  stageEl.hidden  = true;
  resultEl.hidden = false;
  game = null;

  renderWallet();
  renderShop();
}

/* ===== КНОПКИ ===== */
document.getElementById('startGame')?.addEventListener('click', startGame);

document.getElementById('playAgain')?.addEventListener('click', ()=>{
  resultEl.hidden = true;
  startGame();
});

document.getElementById('toShop')?.addEventListener('click', ()=>{
  document.querySelectorAll('.g-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.g-view').forEach(v=>v.classList.remove('active'));
  document.querySelector('.g-tab[data-view="shop"]')?.classList.add('active');
  document.getElementById('view-shop')?.classList.add('active');
  renderShop();
});

/* ===== ТАБЫ ===== */
document.querySelectorAll('.g-tab').forEach(tab=>{
  tab.addEventListener('click', ()=>{
    document.querySelectorAll('.g-tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.g-view').forEach(v=>v.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('view-'+tab.dataset.view)?.classList.add('active');
    if(tab.dataset.view === 'shop')   renderShop();
    if(tab.dataset.view === 'promos') renderPromos();
  });
});

/* ===== СТАРТ ===== */
renderWallet();
renderShop();
renderPromos();
