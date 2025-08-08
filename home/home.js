import { homeConfigRu } from './config_ru.js';
import { homeConfigEn } from './config_en.js';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked@12.0.2/lib/marked.esm.js';
import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.es.mjs';
import * as skinview3d from 'https://cdn.jsdelivr.net/npm/skinview3d@3.4.1/+esm';

const DOM = {
    contentGrid: document.getElementById('content-grid'),

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

    // grid areas
    linksTitle: document.getElementById('nav-title'),
    linksDesc: document.getElementById('nav-desc'),
    linksCtaText: document.getElementById('nav-cta-text'),
    goLinks2: document.getElementById('go-links-btn-2'),

    mediaCol: document.getElementById('media-col'),

    // live
    liveWrap: document.getElementById('live'),
    liveEmbed: document.getElementById('live-embed'),
    liveEmbedWrap: document.getElementById('live-embed-wrap'),
    liveEmpty: document.getElementById('live-empty'),
    liveEmptyTitle: document.getElementById('live-empty-title'),
    liveEmptySub: document.getElementById('live-empty-sub'),
    twitchNotice: document.getElementById('twitch-notice'),
    twitchLink: document.getElementById('twitch-link'),
    twitchText: document.getElementById('twitch-text'),
    twitchCta: document.getElementById('twitch-cta'),

    // calendar
    calPrev: document.getElementById('cal-prev'),
    calNext: document.getElementById('cal-next'),
    calLabel: document.getElementById('cal-label'),
    calHead: document.getElementById('cal-weekdays'),
    calGrid: document.getElementById('cal-grid'),
    legendYt: document.getElementById('legend-yt'),
    legendTw: document.getElementById('legend-tw'),
    legendBoth: document.getElementById('legend-both'),
    legendPlanned: document.getElementById('legend-planned'),
    legendMissed: document.getElementById('legend-missed'),

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

    // controls top (ignored, мы используем нижние)
    themeToggleTop: document.getElementById('theme-toggle'),
    langToggleTop: document.getElementById('lang-toggle'),
    themeIconTop: document.getElementById('theme-icon'),

    // controls bottom — основные
    themeToggleBottom: document.getElementById('theme-toggle-bottom'),
    langToggleBottom: document.getElementById('lang-toggle-bottom'),
    themeIconBottom: document.getElementById('theme-icon-bottom'),

    offlineWarning: document.getElementById('offline-warning')
};

const MONTHS = {
    ru: ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"],
    en: ["January","February","March","April","May","June","July","August","September","October","November","December"]
};
const WEEKDAYS = {
    ru: ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"],
    en: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
};

const state = {
    lang: localStorage.getItem('home_lang') || 'ru',
    theme: localStorage.getItem('home_theme') || 'dark',
    cfg: null,
    data: { followerCounts:{}, youtubeVideos:[], liveStream:{type:'none'} },
    history: { events: [] },
    cal: { year: new Date().getFullYear(), month: new Date().getMonth() },
    skin: { viewer: /** @type {skinview3d.SkinViewer|null} */(null), active: 'idle' }
};

/* helpers */
function setVisibility(el, v){ if(!el) return; el.classList.toggle('hidden', !v); }
function formatCount(n){ if(n==null||isNaN(n))return '—'; if(n>=1e6)return (n/1e6).toFixed(1).replace(/\.0$/,'')+'M'; if(n>=1e3)return (n/1e3).toFixed(1).replace(/\.0$/,'')+'K'; return String(n); }
function md(text){ return DOMPurify.sanitize(marked.parse(text || '')); }
function ymd(d){ return d.toISOString().slice(0,10); }
async function fetchJson(url){ const r=await fetch(url,{cache:'no-store'}); if(!r.ok) throw 0; return await r.json(); }
async function fetchData(){ try{ return await fetchJson(`./data.json?t=${Date.now()}`);}catch{ return { followerCounts:{}, youtubeVideos:[], liveStream:{type:'none'} }; } }
async function fetchHistory(){ try{ return await fetchJson(`./streams_history.json?t=${Date.now()}`);}catch{ return { events: [] }; } }

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
    renderAllStatic(); // локализуем
    renderHero();      // и верхний блок
    renderLiveTexts(); // подписи офлайна
    renderCalendar();  // перерисуем, чтобы подписи месяца/дней обновились
}
function toggleLang(){ setLang(state.lang==='ru'?'en':'ru'); }

function setupOfflineBanner(){
    const upd=()=>setVisibility(DOM.offlineWarning, !navigator.onLine);
    window.addEventListener('online',upd); window.addEventListener('offline',upd); upd();
}

/* static */
function renderAllStatic(){
    const ui = state.cfg.ui, L = state.cfg.links, T = state.cfg.texts;

    // hero
    if (DOM.heroTagline) DOM.heroTagline.textContent = T.heroTagline || '';
    if (DOM.goLinksText) DOM.goLinksText.textContent = state.lang==='ru' ? 'Мои ссылки' : 'My links';
    if (DOM.ctaYTText)   DOM.ctaYTText.textContent   = state.lang==='ru' ? 'Подписаться на YouTube' : 'Subscribe on YouTube';
    if (DOM.ctaTGText)   DOM.ctaTGText.textContent   = 'Telegram';
    if (DOM.ctaSupportText) DOM.ctaSupportText.textContent = state.lang==='ru' ? 'Поддержать' : 'Support';

    // hero links
    if (DOM.goLinks1) DOM.goLinks1.href = L.linksPageUrl || './links/';
    if (DOM.ctaYT)      { if(L.youtubeSubscribeUrl){ DOM.ctaYT.href=L.youtubeSubscribeUrl; setVisibility(DOM.ctaYT,true);} else setVisibility(DOM.ctaYT,false); }
    if (DOM.ctaTG)      { if(L.telegramUrl){ DOM.ctaTG.href=L.telegramUrl; setVisibility(DOM.ctaTG,true);} else setVisibility(DOM.ctaTG,false); }
    if (DOM.ctaSupport) { if(L.supportUrl){ DOM.ctaSupport.href=L.supportUrl; setVisibility(DOM.ctaSupport,true);} else setVisibility(DOM.ctaSupport,false); }

    // links card
    if (DOM.linksTitle)   DOM.linksTitle.textContent   = ui.navTitle || '';
    if (DOM.linksDesc)    DOM.linksDesc.textContent    = ui.navDesc || '';
    if (DOM.linksCtaText) DOM.linksCtaText.textContent = ui.navCta || '';
    if (DOM.goLinks2)     DOM.goLinks2.href = L.linksPageUrl || './links/';

    // about/timeline
    if (DOM.aboutIntro) DOM.aboutIntro.innerHTML = md(T.aboutIntroMd || '');
    if (DOM.aboutOutro) DOM.aboutOutro.innerHTML = md(T.aboutOutroMd || '');
    if (DOM.timelineTitle) DOM.timelineTitle.textContent = ui.timelineTitle || 'Timeline';
    if (DOM.tlExpandText)   DOM.tlExpandText.textContent   = state.lang==='ru' ? 'Развернуть' : 'Expand';
    if (DOM.tlCollapseText) DOM.tlCollapseText.textContent = state.lang==='ru' ? 'Свернуть'  : 'Collapse';
    const tl = T.timeline || [];
    const html = tl.map((it, idx)=>`
    <details class="timeline card m3-shadow-md" ${idx===0?'open':''}>
      <summary><span class="text-lg font-medium">${it.year} — ${it.title || ''}</span><span class="material-symbols-outlined">expand_more</span></summary>
      <div class="md">${md(it.bodyMd || '')}</div>
    </details>
  `).join('');
    if (DOM.timelineWrap) DOM.timelineWrap.innerHTML = html;
    DOM.timelineWrap?.querySelectorAll('details').forEach(d=>{
        const icon = d.querySelector('.material-symbols-outlined');
        const sync = ()=>{ if(icon) icon.style.transform = d.open ? 'rotate(180deg)' : 'rotate(0deg)'; };
        d.addEventListener('toggle', sync); sync();
    });

    // skin block texts
    if (DOM.skinTitle)        DOM.skinTitle.textContent = ui.skinTitle || '';
    if (DOM.skinDownloadText) DOM.skinDownloadText.textContent = ui.skinDownload || '';
    if (DOM.videosTitle)      DOM.videosTitle.textContent = ui.videosTitle || '';
}

function renderHero(){
    const counts = state.data.followerCounts || {};
    const total = Object.values(counts).filter(v=>typeof v==='number').reduce((a,b)=>a+b,0);
    if (DOM.totals) DOM.totals.textContent = (state.cfg.ui.followersLabel || '') + formatCount(total);
}

/* live */
function renderLiveTexts(){
    if (state.lang==='ru'){
        DOM.liveEmptyTitle.textContent = 'Сейчас стрима нет';
        DOM.liveEmptySub.textContent   = 'Обычно стримы по пятницам, 17:00–19:00 МСК.';
        DOM.twitchText.textContent     = 'Стрим также идёт на Twitch!';
        DOM.twitchCta.textContent      = 'Смотреть на Twitch';
        DOM.legendYt.textContent       = 'YouTube';
        DOM.legendTw.textContent       = 'Twitch';
        DOM.legendBoth.textContent     = 'Оба';
        DOM.legendPlanned.textContent  = 'Потенциальный';
        DOM.legendMissed.textContent   = 'Зачёркнутые — стрима не было';
    } else {
        DOM.liveEmptyTitle.textContent = 'No stream right now';
        DOM.liveEmptySub.textContent   = 'Streams are usually on Fridays, 17:00–19:00 MSK.';
        DOM.twitchText.textContent     = 'Stream is also live on Twitch!';
        DOM.twitchCta.textContent      = 'Watch on Twitch';
        DOM.legendYt.textContent       = 'YouTube';
        DOM.legendTw.textContent       = 'Twitch';
        DOM.legendBoth.textContent     = 'Both';
        DOM.legendPlanned.textContent  = 'Planned';
        DOM.legendMissed.textContent   = 'Struck-out — there was no stream';
    }
}

function renderLive(){
    renderLiveTexts();
    const live = state.data.liveStream || { type:'none' };
    const has = live.type !== 'none';

    setVisibility(DOM.liveWrap, true);
    if (has){
        DOM.mediaCol?.classList.remove('offline');
        setVisibility(DOM.liveEmbedWrap, true);
        setVisibility(DOM.liveEmpty, false);
        setVisibility(DOM.twitchNotice, live.type==='youtube' && !!live.twitchLive);
        if (live.type === 'youtube' && live.id){
            DOM.liveEmbed.src = `https://www.youtube.com/embed/${live.id}?autoplay=1&mute=1`;
            if (live.twitchLive && DOM.twitchLink) DOM.twitchLink.href = `https://www.twitch.tv/${live.twitchLive.twitchChannelName}`;
        } else if (live.type === 'twitch' && live.twitchChannelName){
            const parent = location.hostname || 'localhost';
            DOM.liveEmbed.src = `https://player.twitch.tv/?channel=${live.twitchChannelName}&parent=${parent}&autoplay=true&mute=1`;
            setVisibility(DOM.twitchNotice, false);
        }
    } else {
        DOM.mediaCol?.classList.add('offline'); // десктоп: календарь слева, скин справа
        DOM.liveEmbed.src = 'about:blank';
        setVisibility(DOM.twitchNotice, false);
        setVisibility(DOM.liveEmbedWrap, false);
        setVisibility(DOM.liveEmpty, true);
        renderCalendar();
    }
}

/* history + calendar */
function buildMonth(year, month){
    const first = new Date(year, month, 1);
    const startDow = (first.getDay()+6)%7;
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const cells = [];
    for(let i=0;i<startDow;i++) cells.push(null);
    for(let d=1; d<=daysInMonth; d++){
        const dt = new Date(year, month, d);
        const today = new Date(); today.setHours(0,0,0,0);
        const isToday = dt.getTime() === today.getTime();
        const isPast  = dt.getTime() < today.getTime();
        const dow = (dt.getDay()+6)%7; // 4 — пятница
        cells.push({ date: dt, day:d, isToday, isPast, dow });
    }
    return cells;
}
function renderCalendar(){
    if (!DOM.calHead || !DOM.calGrid || !DOM.calLabel) return;

    const months = MONTHS[state.lang];
    DOM.calLabel.textContent = `${months[state.cal.month]} ${state.cal.year}`;
    const week = WEEKDAYS[state.lang];
    DOM.calHead.innerHTML = week.map(w=>`<div class="muted">${w}</div>`).join('');

    const events = (state.history.events || []);
    const byDate = new Map();
    for (const e of events){
        const set = byDate.get(e.date) || { yt:false, tw:false, items:[] };
        if (e.platform === 'youtube') set.yt = true;
        if (e.platform === 'twitch')  set.tw = true;
        set.items.push(e);
        byDate.set(e.date, set);
    }

    const cells = buildMonth(state.cal.year, state.cal.month);
    const html = cells.map(c=>{
        if (!c) return `<div></div>`;
        const ds = ymd(c.date);
        const info = byDate.get(ds);
        const isFriday = c.dow === 4;

        const classes = ['cell'];
        if (isFriday) classes.push('fri');
        if (c.isToday) classes.push('today');

        let dot = '';
        let chips = '';

        if (info){
            if (info.yt && info.tw) dot = `<span class="dot both"></span>`;
            else if (info.yt)       dot = `<span class="dot yt"></span>`;
            else if (info.tw)       dot = `<span class="dot tw"></span>`;

            const yt = info.items.find(x=>x.platform==='youtube');
            const tw = info.items.find(x=>x.platform==='twitch');
            if (yt) chips += `<a href="${yt.url}" target="_blank" rel="noopener">YT</a>`;
            if (tw) chips += (chips?' · ':'') + `<a href="${tw.url}" target="_blank" rel="noopener">TW</a>`;
        } else {
            if (isFriday){
                if (c.isPast) classes.push('passed','no-stream'); // прошедшая пятница без стрима
                else dot = `<span class="dot planned"></span>`;   // будущая пятница — потенциально
            }
        }
        return `<div class="${classes.join(' ')}"><div>${c.day}</div>${dot}${chips?`<div>${chips}</div>`:''}</div>`;
    }).join('');

    DOM.calGrid.innerHTML = html;

    // навигация месяцев
    if (DOM.calPrev) DOM.calPrev.onclick = ()=>{ state.cal.month--; if(state.cal.month<0){state.cal.month=11; state.cal.year--; } renderCalendar(); };
    if (DOM.calNext) DOM.calNext.onclick = ()=>{ state.cal.month++; if(state.cal.month>11){state.cal.month=0; state.cal.year++; } renderCalendar(); };
}

/* videos */
function renderVideos(){
    const vids = state.data.youtubeVideos || [];
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
    [...DOM.skinControls.querySelectorAll('.mini-button')].forEach(b=>{
        b.classList.toggle('active', b.dataset.anim === key);
    });
}
function buildSkinControls(){
    DOM.skinControls.innerHTML='';
    const opts=[
        {k:'idle',icon:'accessibility',ok:!!skinview3d.IdleAnimation},
        {k:'walk',icon:'directions_walk',ok:!!skinview3d.WalkingAnimation},
        {k:'run',icon:'directions_run',ok:!!skinview3d.RunningAnimation},
        {k:'rotate',icon:'autorenew',ok:!!skinview3d.RotatingAnimation},
        {k:'stop',icon:'stop_circle',ok:true}
    ];
    opts.forEach(o=>{
        if(!o.ok) return;
        const btn=document.createElement('button');
        btn.type='button';
        btn.className='mini-button';
        btn.dataset.anim=o.k;
        btn.innerHTML=`<span class="material-symbols-outlined mini-icon">${o.icon}</span>`;
        btn.onclick=()=>applyAnimation(o.k);
        DOM.skinControls.appendChild(btn);
    });
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
    const w=Math.max(1, DOM.skinViewer.clientWidth || 320);
    const h=Math.max(1, DOM.skinViewer.clientHeight || 320);
    state.skin.viewer?.dispose();
    try{
        const viewer=new skinview3d.SkinViewer({ canvas: DOM.skinCanvas, width:w, height:h });
        await viewer.loadSkin('./links/assets/skin.png'); // путь строго фиксирован
        if(skinview3d.IdleAnimation){ viewer.animation=new skinview3d.IdleAnimation(); state.skin.active='idle'; }
        try{ const c=skinview3d.createOrbitControls(viewer); if(c){ c.enablePan=false; c.enableZoom=true; c.target?.set?.(0,17,0); c.update?.(); } }catch{}
        state.skin.viewer=viewer; buildSkinControls();
        new ResizeObserver(()=>{ const ww=Math.max(1, DOM.skinViewer.clientWidth||320); const hh=Math.max(1, DOM.skinViewer.clientHeight||320); state.skin.viewer?.setSize(ww,hh); }).observe(DOM.skinViewer);
    }catch(e){
        console.error('[skin] init failed', e);
        DOM.skinViewer.innerHTML = `<img src="./links/assets/skin.png" alt="Minecraft skin" style="max-width:100%; max-height:100%; object-fit:contain">`;
    }
}

/* boot */
document.addEventListener('DOMContentLoaded', async ()=>{
    setTheme(state.theme);
    setLang(state.lang);
    setupOfflineBanner();

    // загрузка данных
    state.data    = await fetchData();
    state.history = await fetchHistory();

    // моки: ?mockLive=youtube:ID | twitch:channel | both:ID:channel | none
    const q=new URLSearchParams(location.search); const s=q.get('mockLive');
    if (s){
        if (s==='none') state.data.liveStream = { type:'none' };
        else {
            const [k,a,b]=s.split(':');
            if (k==='youtube') state.data.liveStream={ type:'youtube', id:a, title:'Mock YT' };
            else if (k==='twitch') state.data.liveStream={ type:'twitch', twitchChannelName:a, id:'mock', title:'Mock TW' };
            else if (k==='both') state.data.liveStream={ type:'youtube', id:a, title:'Mock YT', twitchLive:{ type:'twitch', twitchChannelName:b, id:'mock', title:'Mock TW'} };
        }
    }

    renderHero();
    renderLive();
    renderVideos();
    await initSkin();

    // нижние кнопки — основные
    DOM.themeToggleBottom && (DOM.themeToggleBottom.onclick = toggleTheme);
    DOM.langToggleBottom  && (DOM.langToggleBottom.onclick  = toggleLang);

    // если верхние остались — тоже работаем
    DOM.themeToggleTop && (DOM.themeToggleTop.onclick = toggleTheme);
    DOM.langToggleTop  && (DOM.langToggleTop.onclick  = toggleLang);

    // календарь навигация
    if (DOM.calPrev) DOM.calPrev.onclick = ()=>{ state.cal.month--; if(state.cal.month<0){state.cal.month=11; state.cal.year--; } renderCalendar(); };
    if (DOM.calNext) DOM.calNext.onclick = ()=>{ state.cal.month++; if(state.cal.month>11){state.cal.month=0; state.cal.year++; } renderCalendar(); };
});