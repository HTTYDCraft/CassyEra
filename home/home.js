import { homeConfigRu } from './config_ru.js';
import { homeConfigEn } from './config_en.js';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked@12.0.2/lib/marked.esm.js';
import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.es.mjs';
import * as skinview3d from 'https://cdn.jsdelivr.net/npm/skinview3d@3.4.1/+esm';

const SKIN_URL = './links/assets/skin.png';

const DOM = {
    // hero
    heroTagline: document.getElementById('hero-tagline'),
    totals: document.getElementById('totals'),
    goLinks1: document.getElementById('go-links-btn'),
    goLinksText: document.getElementById('go-links-text'),
    ctaYT: document.getElementById('cta-ytsub'),
    ctaYTText: document.getElementById('cta-ytsub-text'),
    ctaTG: document.getElementById('cta-telegram'),
    ctaTGText: document.getElementById('cta-telegram-text'),
    ctaSupport: document.getElementById('cta-support'),
    ctaSupportText: document.getElementById('cta-support-text'),

    // about + timeline
    aboutIntro: document.getElementById('about-intro'),
    timelineWrap: document.getElementById('timeline'),
    aboutOutro: document.getElementById('about-outro'),
    timelineTitle: document.getElementById('timeline-title'),
    tlExpand: document.getElementById('tl-expand'),
    tlCollapse: document.getElementById('tl-collapse'),
    tlExpandText: document.getElementById('tl-expand-text'),
    tlCollapseText: document.getElementById('tl-collapse-text'),

    // left card (grid)
    navTitle: document.getElementById('nav-title'),
    navDesc: document.getElementById('nav-desc'),
    navCtaText: document.getElementById('nav-cta-text'),
    goLinks2: document.getElementById('go-links-btn-2'),

    // Новые блоки (grid)
    hobbiesTitle: document.getElementById('hobbies-title'),
    hobbiesContent: document.getElementById('hobbies-content'),
    projectsTitle: document.getElementById('projects-title'),
    projectsList: document.getElementById('projects-list'),

    // skin
    skinSection: document.getElementById('skin'),
    skinTitle: document.getElementById('skin-title'),
    skinViewer: document.getElementById('skin-viewer'),
    skinCanvas: document.getElementById('skin-canvas'),
    skinControls: document.getElementById('skin-controls'),
    skinDownload: document.getElementById('download-skin'),
    skinDownloadText: document.getElementById('skin-download-text'),

    // videos
    videosTitle: document.getElementById('videos-title'),
    carousel: document.getElementById('carousel'),

    // toggles
    themeToggleBottom: document.getElementById('theme-toggle-bottom'),
    langToggleBottom: document.getElementById('lang-toggle-bottom'),
    themeIconBottom: document.getElementById('theme-icon-bottom'),
    themeToggleTop: document.getElementById('theme-toggle'),
    langToggleTop: document.getElementById('lang-toggle'),
    themeIconTop: document.getElementById('theme-icon'),

    offlineWarning: document.getElementById('offline-warning')
};

const state = {
    lang: localStorage.getItem('home_lang') || 'ru',
    theme: localStorage.getItem('home_theme') || 'dark',
    cfg: null,
    data: { followerCounts:{}, youtubeVideos:[] },
    skin: { viewer: /** @type {skinview3d.SkinViewer|null} */(null), active: 'idle', ro: /** @type {ResizeObserver|null} */(null) }
};

/* utils */
function setVisibility(el, v){ if(!el) return; el.classList.toggle('hidden', !v); }
function formatCount(n){ if(n==null||isNaN(n))return '—'; if(n>=1e6)return (n/1e6).toFixed(1).replace(/\.0$/,'')+'M'; if(n>=1e3)return (n/1e3).toFixed(1).replace(/\.0$/,'')+'K'; return String(n); }
function md(text){ return DOMPurify.sanitize(marked.parse(text || '')); }
async function fetchJson(url){ const r=await fetch(url,{cache:'no-store'}); if(!r.ok) throw 0; return await r.json(); }
async function fetchData(){ try{ return await fetchJson(`./data.json?t=${Date.now()}`);}catch{ return { followerCounts:{}, youtubeVideos:[] }; } }

/* theme/lang */
function setTheme(theme){
    document.body.classList.remove('dark-theme','light-theme');
    document.body.classList.add(`${theme}-theme`);
    localStorage.setItem('home_theme', theme);
    const icon = DOM.themeIconBottom || DOM.themeIconTop;
    if (icon) icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
}
function toggleTheme(){ setTheme(state.theme = state.theme==='dark'?'light':'dark'); }
function setLang(lang){
    state.lang = lang; localStorage.setItem('home_lang', lang);
    state.cfg = (lang==='en') ? homeConfigEn : homeConfigRu;
    renderAllStatic(); renderHero();
}
function toggleLang(){ setLang(state.lang==='ru'?'en':'ru'); }

function setupOfflineBanner(){
    const upd=()=>setVisibility(DOM.offlineWarning, !navigator.onLine);
    window.addEventListener('online',upd); window.addEventListener('offline',upd); upd();
}

/* STATIC */
function renderAllStatic(){
    const ui = state.cfg.ui, L = state.cfg.links, T = state.cfg.texts;

    // hero
    DOM.heroTagline && (DOM.heroTagline.textContent = T.heroTagline || '');
    DOM.goLinksText && (DOM.goLinksText.textContent = state.lang==='ru' ? 'Мои ссылки' : 'My links');
    DOM.ctaYTText && (DOM.ctaYTText.textContent = state.lang==='ru' ? 'Подписаться на YouTube' : 'Subscribe on YouTube');
    DOM.ctaTGText && (DOM.ctaTGText.textContent = 'Telegram');
    DOM.ctaSupportText && (DOM.ctaSupportText.textContent = state.lang==='ru' ? 'Поддержать' : 'Support');

    // links
    if (DOM.goLinks1) DOM.goLinks1.href = L.linksPageUrl || './links/';
    if (DOM.ctaYT)      { if(L.youtubeSubscribeUrl && L.youtubeSubscribeUrl!=='#'){ DOM.ctaYT.href=L.youtubeSubscribeUrl; setVisibility(DOM.ctaYT,true);} else setVisibility(DOM.ctaYT,false); }
    if (DOM.ctaTG)      { if(L.telegramUrl && L.telegramUrl!=='#'){ DOM.ctaTG.href=L.telegramUrl; setVisibility(DOM.ctaTG,true);} else setVisibility(DOM.ctaTG,false); }
    if (DOM.ctaSupport) { if(L.supportUrl && L.supportUrl!=='#'){ DOM.ctaSupport.href=L.supportUrl; setVisibility(DOM.ctaSupport,true);} else setVisibility(DOM.ctaSupport,false); }

    DOM.navTitle && (DOM.navTitle.textContent = ui.navTitle || '');
    DOM.navDesc && (DOM.navDesc.textContent = ui.navDesc || '');
    DOM.navCtaText && (DOM.navCtaText.textContent = ui.navCta || '');
    if (DOM.goLinks2) DOM.goLinks2.href = L.linksPageUrl || './links/';

    // about/timeline
    DOM.aboutIntro && (DOM.aboutIntro.innerHTML = md(T.aboutIntroMd || ''));
    DOM.aboutOutro && (DOM.aboutOutro.innerHTML = md(T.aboutOutroMd || ''));
    // ИСПРАВЛЕНО: Убрана заглушка 'Timeline', теперь будет пусто, если в конфиге не задано
    DOM.timelineTitle && (DOM.timelineTitle.textContent = ui.timelineTitle || '');
    DOM.tlExpandText && (DOM.tlExpandText.textContent = state.lang==='ru' ? 'Развернуть' : 'Expand');
    DOM.tlCollapseText && (DOM.tlCollapseText.textContent = state.lang==='ru' ? 'Свернуть' : 'Collapse');

    const tl = T.timeline || [];
    const html = tl.map((it, idx)=>`
    <details class="timeline card m3-shadow-md" ${idx===0?'open':''}>
      <summary><span class="text-lg font-medium">${it.year} — ${it.title || ''}</span><span class="material-symbols-outlined">expand_more</span></summary>
      <div class="md">${md(it.bodyMd || '')}</div>
    </details>
  `).join('');
    if (DOM.timelineWrap) DOM.timelineWrap.innerHTML = html;

    // Рендер хобби и проектов
    DOM.hobbiesTitle && (DOM.hobbiesTitle.textContent = T.hobbiesTitle || '');
    DOM.hobbiesContent && (DOM.hobbiesContent.innerHTML = md(T.hobbiesMd || ''));

    DOM.projectsTitle && (DOM.projectsTitle.textContent = T.projectsTitle || '');
    if (DOM.projectsList) {
        const projects = T.projects || [];
        DOM.projectsList.innerHTML = projects.map(project => {
            const buttonHtml = (project.button && project.button.url && project.button.text)
                ? `<div class="mt-3"><a href="${project.button.url}" target="_blank" rel="noopener" class="primary-button rounded-full px-4 py-2 font-medium">${project.button.text}</a></div>`
                : '';

            return `
                <div class="project-item">
                    <h3 class="text-lg font-bold">${project.title || ''}</h3>
                    <div class="md">${md(project.bodyMd || '')}</div>
                    ${buttonHtml}
                </div>
            `;
        }).join('');
    }

    // skin / videos
    DOM.skinTitle && (DOM.skinTitle.textContent = ui.skinTitle || '');
    DOM.skinDownloadText && (DOM.skinDownloadText.textContent = ui.skinDownload || '');
    DOM.videosTitle && (DOM.videosTitle.textContent = ui.videosTitle || '');

    wireTimelineControls();
    enableUnifiedHover();
}

function wireTimelineControls(){
    if (DOM.tlExpand) DOM.tlExpand.onclick = () => DOM.timelineWrap?.querySelectorAll('details').forEach(d => d.open = true);
    if (DOM.tlCollapse) DOM.tlCollapse.onclick = () => DOM.timelineWrap?.querySelectorAll('details').forEach(d => d.open = false);
}

function enableUnifiedHover(){
    document.querySelectorAll('.card').forEach(el=>{
        if (el.dataset.hoverBound) return;
        el.dataset.hoverBound = '1';

        let touchMoved = false;
        let clearTimer = null;

        const add = ()=> { el.classList.add('is-hover'); if (clearTimer) { clearTimeout(clearTimer); clearTimer = null; } };
        const removeDelayed = ()=> { if (clearTimer) clearTimeout(clearTimer); clearTimer = setTimeout(()=> el.classList.remove('is-hover'), 120); };
        const removeNow = ()=> { if (clearTimer) clearTimeout(clearTimer); el.classList.remove('is-hover'); };

        el.addEventListener('pointerenter', (e)=>{ if(e.pointerType!=='touch') add(); }, { passive:true });
        el.addEventListener('pointerleave', (e)=>{ if(e.pointerType!=='touch') removeNow(); }, { passive:true });
        el.addEventListener('touchstart', ()=>{ touchMoved=false; add(); }, { passive:true });
        el.addEventListener('touchmove', ()=>{ touchMoved=true; removeNow(); }, { passive:true });
        el.addEventListener('touchend', ()=>{ if(!touchMoved) removeDelayed(); else removeNow(); }, { passive:true });
    });
}

/* HERO totals */
function renderHero(){
    setVisibility(DOM.totals, false);
    const counts = state.data.followerCounts || {};
    const total = Object.values(counts).filter(v=>typeof v==='number').reduce((a,b)=>a+b,0);
    if (total > 0) {
        DOM.totals && (DOM.totals.textContent = (state.cfg.ui.followersLabel || '') + formatCount(total));
        setVisibility(DOM.totals, true);
    }
}

/* videos */
function renderVideos(){
    const vids = state.data.youtubeVideos || [];
    if (!DOM.carousel) return;
    DOM.carousel.innerHTML = '';
    vids.forEach(v=>{
        const a=document.createElement('a');
        a.href=`https://www.youtube.com/watch?v=${v.id}`; a.target='_blank';
        a.className='flex-shrink-0 w-64 rounded-2xl overflow-hidden m3-shadow-md card';
        a.innerHTML = `<img src="${v.thumbnailUrl}" alt="${v.title}" class="w-full h-36 object-cover"><div class="p-3"><p class="text-sm font-medium leading-tight">${v.title}</p></div>`;
        DOM.carousel.appendChild(a);
    });
    DOM.carousel.addEventListener('wheel', (e)=>{ if(e.deltaY){ e.preventDefault(); DOM.carousel.scrollLeft += e.deltaY; } }, { passive:false });
}

/* skin */
function setActiveMini(key){
    state.skin.active = key;
    if (!DOM.skinControls) return;
    const btns = DOM.skinControls.querySelectorAll('.mini-button');
    btns.forEach(b=>{
        const isActive = b.getAttribute('data-anim') === key;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
}
function buildSkinControls(){
    if (!DOM.skinControls) return;
    DOM.skinControls.innerHTML='';
    const opts=[
        {k:'idle',icon:'accessibility',ok:!!skinview3d.IdleAnimation},
        {k:'walk',icon:'directions_walk',ok:!!skinview3d.WalkingAnimation},
        {k:'run',icon:'directions_run',ok:!!skinview3d.RunningAnimation},
        {k:'rotate',icon:'autorenew',ok:!!skinview3d.RotatingAnimation},
        {k:'stop',icon:'stop_circle',ok:true}
    ];
    for (const o of opts){
        if(!o.ok) continue;
        const btn=document.createElement('button');
        btn.type='button';
        btn.className='mini-button';
        btn.setAttribute('data-anim', o.k);
        btn.setAttribute('aria-label', o.k);
        btn.setAttribute('aria-pressed', 'false');
        btn.innerHTML=`<span class="material-symbols-outlined mini-icon">${o.icon}</span>`;
        btn.addEventListener('click', (e)=>{ e.preventDefault(); applyAnimation(o.k); });
        DOM.skinControls.appendChild(btn);
    }
    setActiveMini(state.skin.active);
}
function applyAnimation(key){
    if(!state.skin.viewer) return;
    let anim=null;
    try{
        if(key==='idle' && skinview3d.IdleAnimation) anim=new skinview3d.IdleAnimation();
        else if(key==='walk' && skinview3d.WalkingAnimation) anim=new skinview3d.WalkingAnimation();
        else if(key==='run' && skinview3d.RunningAnimation) anim=new skinview3d.RunningAnimation();
        else if(key==='rotate' && skinview3d.RotatingAnimation) anim=new skinview3d.RotatingAnimation();
        else if(key==='stop') anim=null;
        state.skin.viewer.animation=anim; setActiveMini(key);
    }catch(e){ console.warn('[skin] anim error', e); }
}
async function initSkin(){
    if(!DOM.skinViewer || !DOM.skinCanvas || !DOM.skinSection) return;
    setVisibility(DOM.skinSection, true);
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));

    try {
        const viewer=new skinview3d.SkinViewer({ canvas: DOM.skinCanvas, width:300, height:300 });
        await viewer.loadSkin(SKIN_URL);
        if (skinview3d.IdleAnimation) { viewer.animation=new skinview3d.IdleAnimation(); state.skin.active='idle'; }
        const c=skinview3d.createOrbitControls(viewer);
        if(c){ c.enablePan=false; c.enableZoom=true; c.target?.set?.(0,17,0); c.update?.(); }

        state.skin.viewer=viewer;
        buildSkinControls();

        const ro = new ResizeObserver(entries=>{
            const cr=entries[0]?.contentRect; if(!cr) return;
            viewer.setSize(cr.width, cr.height);
        });
        ro.observe(DOM.skinViewer);
        state.skin.ro = ro;
    }catch(e){
        console.error('[skin] init failed', e);
        DOM.skinViewer.innerHTML = `<img src="${SKIN_URL}" alt="Minecraft skin" style="max-width:100%; max-height:100%; object-fit:contain; image-rendering: pixelated;">`;
    }
}

async function downloadSkin(ev){
    ev?.preventDefault?.();
    window.open(SKIN_URL, '_blank');
}

/* boot */
document.addEventListener('DOMContentLoaded', async ()=>{
    setTheme(state.theme);
    setLang(state.lang);
    setupOfflineBanner();

    state.data = await fetchData();

    renderHero();
    renderVideos();
    await initSkin();

    DOM.skinDownload?.addEventListener('click', downloadSkin);
    DOM.themeToggleBottom && (DOM.themeToggleBottom.onclick = toggleTheme);
    DOM.langToggleBottom  && (DOM.langToggleBottom.onclick  = toggleLang);
    DOM.themeToggleTop && (DOM.themeToggleTop.onclick = toggleTheme);
    DOM.langToggleTop  && (DOM.langToggleTop.onclick  = toggleLang);
});