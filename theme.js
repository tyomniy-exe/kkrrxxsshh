(function(){
  const KEY='kkrx_theme';
  const root=document.documentElement;
  const btn=document.getElementById('themeToggle');
  const secret=document.getElementById('secretGamesBtn');

  function apply(theme, showGlitch){
    root.setAttribute('data-theme',theme);
    if(btn) btn.textContent = theme==='dark' ? '☀' : '☾';
    if(secret){
      if(theme==='dark'){
        secret.hidden=false;
        if(showGlitch){
          root.classList.add('theme-glitch');
          setTimeout(()=>root.classList.remove('theme-glitch'),320);
        }
      } else {
        secret.hidden=true;
      }
    }
  }

  const saved = localStorage.getItem(KEY) || 'light';
  apply(saved, false); // при загрузке без глитча

  if(btn) btn.addEventListener('click',()=>{
    const next = root.getAttribute('data-theme')==='dark' ? 'light' : 'dark';
    localStorage.setItem(KEY,next);
    apply(next, next==='dark'); // глитч только при входе в тёмную
  });
})();